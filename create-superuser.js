const fs = require('fs');

async function createSuperUser() {
    // Pegando as chaves do .env se existirem, caso contrário usa o mock
    let BASE_URL = 'https://db.dunhas.com/api';
    let API_KEY = '1b4a19fdc1eda3f481543b0f25b01ab428e0f6467ad7c9c1';
    
    try {
        const env = fs.readFileSync('.env', 'utf8');
        const urlMatch = env.match(/VITE_JSON_DB_URL=(.+)/);
        const keyMatch = env.match(/VITE_JSON_DB_API_KEY=(.+)/);
        if (urlMatch) BASE_URL = urlMatch[1].trim();
        if (keyMatch) API_KEY = keyMatch[1].trim();
    } catch (e) {
        // ignora se .env não existir
    }

    const email = process.argv[2];
    const password = process.argv[3];

    if (!email || !password) {
        console.log("❌ Uso incorreto.");
        console.log("👉 Como usar: node create-superuser.js <seu-email> <sua-senha>");
        console.log("Exemplo: node create-superuser.js felipe@certifiq.pro 123456");
        process.exit(1);
    }

    const newUser = {
        id: 'usr_' + Date.now(),
        role: 'SUPER_ADMIN',
        name: 'Super Admin ' + email.split('@')[0],
        email: email,
        password: password,
        companyId: null
    };

    console.log("⏳ Criando super usuário no banco de dados...");

    const res = await fetch(`${BASE_URL}/certifiq_users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY
        },
        body: JSON.stringify(newUser)
    });

    if (res.ok) {
        console.log("✅ Super usuário criado com sucesso!");
        console.log("E-mail:", email);
        console.log("Senha:", password);
        console.log("Você já pode fazer login na plataforma.");
    } else {
        console.log("❌ Falha ao criar super usuário:", res.statusText);
        const txt = await res.text();
        console.log(txt);
    }
}

createSuperUser();
