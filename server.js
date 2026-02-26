const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const selfsigned = require('selfsigned');

const app = express();
const PORT = 443;
const DEFAULT_HOST = 'shop.pemites.com';
const DOMAIN_FILE = path.join(__dirname, 'last_domain.txt');

// 도메인 결정 로직
let currentHost = process.argv[2];

if (!currentHost) {
    if (fs.existsSync(DOMAIN_FILE)) {
        currentHost = fs.readFileSync(DOMAIN_FILE, 'utf8').trim();
    } else {
        currentHost = DEFAULT_HOST;
    }
}

// 현재 도메인 저장
fs.writeFileSync(DOMAIN_FILE, currentHost);

const HOST = currentHost;

// 정적 파일 서비스 (html 폴더)
app.use(express.static(path.join(__dirname, 'html')));

// 인증서 파일 경로 (도메인별로 구분하거나 도메인 변경 시 재생성되도록 함)
const certPath = path.join(__dirname, `cert_${HOST}.pem`);
const keyPath = path.join(__dirname, `key_${HOST}.pem`);

let options = {};

// 인증서가 없으면 생성
async function startServer() {
    if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
        console.log(`인증서를 생성합니다: ${HOST}`);
        const attrs = [{ name: 'commonName', value: HOST }];
        const pems = await selfsigned.generate(attrs, { days: 365 });

        fs.writeFileSync(certPath, pems.cert);
        fs.writeFileSync(keyPath, pems.private);

        options = {
            key: pems.private,
            cert: pems.cert
        };
    } else {
        options = {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath)
        };
    }

    // HTTPS 서버 실행
    try {
        https.createServer(options, app).listen(PORT, () => {
            console.log(`================================================`);
            console.log(`HTTPS 서버가 실행 중입니다: https://${HOST}`);
            console.log(`로컬 테스트용: https://localhost`);
            console.log(`Root Doc: ${path.join(__dirname, 'html')}`);
            console.log(`================================================`);
            console.log(`[안내] ${HOST} 로 접속하려면 hosts 파일에 다음을 추가하세요:`);
            console.log(`127.0.0.1  ${HOST}`);
            console.log(`================================================`);
            console.log(`* 다른 도메인으로 실행하려면: node server.js <domain>`);
        });
    } catch (error) {
        if (error.code === 'EACCES') {
            console.error(`Error: 포트 ${PORT}에 접근할 권한이 없습니다. 관리자 권한으로 실행하거나 포트를 변경하세요.`);
        } else {
            console.error('서버 실행 중 오류 발생:', error);
        }
    }
}

startServer();
