const express = require('express');
const shortid = require('shortid');
const validUrl = require('valid-url');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const urlDatabase = {};

// 홈 화면
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 짧은 URL 생성
app.post('/shorten', (req, res) => {
    const { originalUrl, customCode } = req.body;

    if (!validUrl.isUri(originalUrl)) {
        return res.status(400).json({ error: '유효하지 않은 URL입니다.' });
    }

    let shortCode;

    if (customCode) {
        if (!/^[a-zA-Z0-9_-]{3,30}$/.test(customCode)) {
            return res.status(400).json({ error: '코드는 3~30자의 영문, 숫자, -, _ 만 가능합니다.' });
        }

        if (urlDatabase[customCode]) {
            return res.status(409).json({ error: '이미 존재하는 코드입니다.' });
        }

        shortCode = customCode;
    } else {
        shortCode = shortid.generate();
    }

    const shortUrl = `${req.protocol}://${req.get('host')}/${shortCode}`;

    urlDatabase[shortCode] = {
        originalUrl,
        shortUrl,
        clicks: 0,
        createdAt: new Date()
    };

    res.json({
        originalUrl,
        shortUrl,
        shortCode
    });
});

// 통계 조회
app.get('/stats/:shortCode', (req, res) => {
    const { shortCode } = req.params;
    const urlData = urlDatabase[shortCode];

    if (!urlData) {
        return res.status(404).json({ error: '짧은 URL을 찾을 수 없습니다.' });
    }

    res.json(urlData);
});

// 리디렉션
app.get('/:shortCode', (req, res) => {
    const { shortCode } = req.params;
    const urlData = urlDatabase[shortCode];

    if (!urlData) {
        return res.status(404).send('짧은 URL을 찾을 수 없습니다.');
    }

    urlData.clicks++;
    res.redirect(urlData.originalUrl);
});

app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
