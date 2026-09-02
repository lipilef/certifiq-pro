const fs = require('fs');
let c = fs.readFileSync('src/components/features/admin/SuperAdminDashboard.tsx', 'utf8');

c = c.replace(/{!isEditing && \(\s*<>\s*/g, '');
c = c.replace(/<\/>\s*\)\}/g, '');
c = c.replace(/Senha Inicial/g, 'Senha do Admin');

const customTemplateUrlInput = `
              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-1 text-slate-700">Template URL Personalizado (Background)</label>
                <input type="url" value={formData.customTemplateUrl || ''} onChange={e => setFormData({...formData, customTemplateUrl: e.target.value})} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-slate-500" placeholder="https://exemplo.com/fundo-a4.png" />
              </div>
`;

if (!c.includes('Template URL Personalizado')) {
    c = c.replace(/<div className="md:col-span-3">\s*<label className="block text-sm font-medium mb-1 text-slate-700">Logo URL \(Opcional\)<\/label>/g, 
      customTemplateUrlInput + '<div className="md:col-span-3">\n<label className="block text-sm font-medium mb-1 text-slate-700">Logo URL (Opcional)</label>');
}

fs.writeFileSync('src/components/features/admin/SuperAdminDashboard.tsx', c, 'utf8');
console.log('Fixed inputs');
