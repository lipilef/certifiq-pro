import domtoimage from 'dom-to-image-more';
import { jsPDF } from 'jspdf';

export const generatePDF = async (elementId: string, filename: string, setLoading?: (v: boolean) => void) => {
  if (setLoading) setLoading(true);
  try {
    const page1 = document.getElementById(elementId + '-page1');
    const page2 = document.getElementById(elementId + '-page2');
    
    if (!page1) throw new Error("Página 1 não encontrada");

    // A4 Landscape size in pixels (at 96 DPI) is roughly 1123 x 794
    // We use exactly what's rendered (1123x792)
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [1123, 792]
    });

    // We scale up the resolution for crisp text (scale: 2)
    const scale = 2;
    const style = {
      transform: 'scale(1)',
      transformOrigin: 'top left',
      width: '1123px',
      height: '792px'
    };
    const options = {
      width: 1123 * scale,
      height: 792 * scale,
      style: {
        transform: 'scale(' + scale + ')',
        transformOrigin: 'top left'
      }
    };

    const dataUrl1 = await domtoimage.toJpeg(page1, { ...options, quality: 0.95 });
    pdf.addImage(dataUrl1, 'JPEG', 0, 0, 1123, 792);

    if (page2) {
      pdf.addPage([1123, 792], 'landscape');
      const dataUrl2 = await domtoimage.toJpeg(page2, { ...options, quality: 0.95 });
      pdf.addImage(dataUrl2, 'JPEG', 0, 0, 1123, 792);
    }

    pdf.save(filename + '.pdf');
  } catch (err) {
    console.error("Erro ao gerar PDF:", err);
    alert("Houve um erro ao gerar o PDF. Verifique o console.");
  } finally {
    if (setLoading) setLoading(false);
  }
};
