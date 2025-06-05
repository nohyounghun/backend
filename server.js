const express = require('express'); //express 기본 라우팅
const app = express(); //express 기본 라우팅
const port = 9070;
const cors = require('cors'); //교차 출처 공유 허용
const mysql = require('mysql'); //mysql 모듈 불러오기
const bcrypt = require('bcrypt'); //비밀번호 암호화를 위한 bcrypt 모듈 불러오기
const jwt = require('jsonwebtoken'); //JWT 토큰 생성을 위한 모듈 불러오기
const SECRET_KEY = 'test'; //JWT 비밀키

app.use(cors());

app.use(express.json());

//1. musql db연결 정보 세팅
const connection = mysql.createConnection({
    host: 'database',
    user: 'root',
    password: '1234',
    database: 'database'
});
//2. mysql db접속시 오류가 나면 에러 출력, 성공하면 성공 표시
connection.connect((err) => {
    if (err) {
        console.error('DB 연결 실패:', err);
        return;
    }
    console.log('DB 연결 성공');
});

//3. 로그인 폼에서 post방식으로 전달받은 데이터를 db에 조회하여 결과값을 리턴함
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    connection.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err || results.length === 0) {
            return res.status(401).json({ error: '아이디 또는 비밀번호가 일치하지 않습니다.' });
        }

        const user = results[0]; // 조회된 사용자 정보

        try {
            const isMatch = await bcrypt.compare(password, user.password); // 비밀번호 비교

            if (!isMatch) {
                return res.status(401).json({ error: '아이디 또는 비밀번호가 일치하지 않습니다.' });
            }

            // JWT 토큰 생성 (1시간)
            const token = jwt.sign({ id: user.id }, 'your_secret_key', { expiresIn: '1h' });
            return res.json({ message: '로그인 성공', token });
        } catch (bcryptError) {
            console.error('비밀번호 비교 중 오류:', bcryptError);
            return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
        }
    });
});

//4. Register.js에서 넘겨 받은 username, password를 sql db에 입력하여 추가한다.
app.post('/register', async(req, res)=>{
    const {username, password} = req.body; //사용자 입력값을 변수에 저장
    const hash = await bcrypt.hash(password, 10); //비밀번호를 bcrypt로 암호화

    connection.query('INSERT INTO users (username, password) VALUES (?,?)', [username, hash],
        (err, result) => {
            if(err){
                if(err.code == 'ER_DUP_ENTRY'){
                    return res.status(400).json({error: '이미 존재하는 아이디입니다.'});
                }
                return res. status(500).json({error:'회원가입 실패'});
            }
            res.json({success: true, message: '회원가입 성공'});
        }
)
});

//방법1. mysql db연결 테스트
// app.get('/',(req,res)=>{
//   //특정 경로로 요청된 정보를 처리
//   res.json('Excused from Backend');
// })

//방법2. SQL쿼리문을 사용하여 DB에서 조회된 데이터를 출력한다.
app.get('/goods', (req, res) => {
    connection.query("SELECT * FROM goods ORDER BY g_code DESC", (err, results) => {
        if (err) {
            console.log('쿼리문 오류 : ', err);
            res.status(500).json({ error: 'DB쿼리 오류' });
            return;
        }
        res.json(results);
    });
});

/* books 데이터 출력*/
app.get('/books', (req, res) => {
    connection.query("SELECT * FROM book_store", (err, results) => {
        if (err) {
            console.log('쿼리문 오류 : ', err);
            res.status(500).json({ error: 'DB쿼리 오류' });
            return;
        }
        res.json(results);
    });
});

/* fruits 데이터 출력 */
app.get('/fruits', (req, res) => {
    connection.query("SELECT * FROM fruit", (err, results) => {
        if (err) {
            console.log('쿼리문 오류 : ', err);
            res.status(500).json({ error: 'DB쿼리 오류' });
            return;
        }
        res.json(results);
    });
});

//2. 상품삭제 (DELETE)
//상품삭제는 상품코드(g_code)를 기준으로 삭제한다.
app.delete('/goods/:g_code', (req, res) => {
    const g_code = req.params.g_code;
    connection.query("DELETE FROM goods WHERE g_code = ?", [g_code], (err, result) => {
        if (err) {
            console.log('삭제 오류 : ', err);
            res.status(500).json({ error: '상품 삭제 실패' });
            return;
        }
        res.json({ success: true });
    });
});

/* books 상품 삭제 */
app.delete('/books/:b_code', (req, res) => {
    const b_code = req.params.b_code;
    connection.query("DELETE FROM book_store WHERE num = ?", [b_code], (err, result) => {
        if (err) {
            console.log('삭제 오류 : ', err);
            res.status(500).json({ error: '상품 삭제 실패' });
            return;
        }
        res.json({ success: true });
    });
});

/* fruits 상품 삭제 */
app.delete('/fruits/:num', (req, res) => {
    const num = req.params.num;
    connection.query("DELETE FROM fruit WHERE num = ?", [num], (err, result) => {
        if (err) {
            console.log('삭제 오류 : ', err);
            res.status(500).json({ error: '상품 삭제 실패' });
            return;
        }
        res.json({ success: true });
    });
});

//3. 상품수정 (UPDATE)
//상품수정은 상품코드(g_code)를 기준으로 수정한다.
app.put('/goods/update/:g_code', (req, res) => {
    const g_code = req.params.g_code;
    const { g_name, g_cost } = req.body;
    connection.query(
        'UPDATE goods SET g_name = ?, g_cost = ? WHERE g_code = ?',
        [g_name, g_cost, g_code],
        (err, result) => {
            if (err) {
                console.log('수정 오류:', err);
                res.status(500).json({ error: '상품 수정 실패' });
                return;
            }
            res.json({ success: true });
        }
    );
});

/* books 상품 수정 */
app.put('/books/booksupdate/:b_code', (req, res) => {
    const b_code = req.params.b_code;
    const { name, area1, area2, area3, book_cnt, owner_nm, tel_num } = req.body;
    connection.query(
        'UPDATE book_store SET name = ?, area1 = ?, area2 = ?, area3 = ?, book_cnt = ?, owner_nm = ?, tel_num = ? WHERE num = ?',
        [name, area1, area2, area3, book_cnt, owner_nm, tel_num, b_code],
        (err, result) => {
            if (err) {
                console.log('수정 오류:', err);
                res.status(500).json({ error: '상품 수정 실패' });
                return;
            }
            res.json({ success: true });
        }
    );
});

//4. 특정 상품 조회 (GET /goods/:g_code)
app.get('/goods/:g_code', (req, res) => {
    const g_code = req.params.g_code;

    connection.query(
        'SELECT * FROM goods WHERE g_code = ?',
        [g_code],
        (err, results) => {
            if (err) {
                console.log('조회 오류:', err);
                res.status(500).json({ error: '상품 조회 실패' });
                return;
            }

            if (results.length === 0) {
                res.status(404).json({ error: '해당 상품이 없습니다.' });
                return;
            }

            res.json(results[0]); // 단일 객체만 반환
        }
    );
});

/* books 상품 조회 */
app.get('/books/:b_code', (req, res) => {
    const b_code = req.params.b_code;

    connection.query(
        'SELECT * FROM book_store WHERE num = ?',
        [b_code],
        (err, results) => {
            if (err) {
                console.log('조회 오류:', err);
                res.status(500).json({ error: '상품 조회 실패' });
                return;
            }

            if (results.length === 0) {
                res.status(404).json({ error: '해당 상품이 없습니다.' });
                return;
            }

            res.json(results[0]); // 단일 객체만 반환
        }
    );
});

//5. 상품등록하기 (create, insert into)
//post방식으로 /goods받음
app.post('/goods', (req, res) => {
    const { g_name, g_cost } = req.body;
    if (!g_name || !g_cost) {
        return res.status(400).json({ error: '필수항목이 누락되었습니다.' });
    }
    //쿼리문 실행
    connection.query('INSERT INTO goods (g_name, g_cost) VALUES (?, ?)', [g_name, g_cost], (err, result) => {
        if (err) {
            console.log('DB등록 실패 :', err);
            res.status(500).json({ error: '상품 등록 실패' });
            return;
        }
        res.json({ success: true, insertId: result.insertId });
    });
});

/* books 상품 등록 */
app.post('/books', (req, res) => {
    const { name, area1, area2, area3, book_cnt, owner_nm, tel_num } = req.body;
    if (!name || !area1 || !area2 || !area3 || !book_cnt || !owner_nm || !tel_num) {
        return res.status(400).json({ error: '필수항목이 누락되었습니다.' });
    }
    //쿼리문 실행
    connection.query('INSERT INTO book_store (name, area1, area2, area3, book_cnt, owner_nm, tel_num) VALUES (?, ?, ?, ?, ?, ?, ?)', [name, area1, area2, area3, book_cnt, owner_nm, tel_num], (err, result) => {
        if (err) {
            console.log('DB등록 실패 :', err);
            res.status(500).json({ error: '상품 등록 실패' });
            return;
        }
        res.json({ success: true, insertId: result.insertId });
    });
});

/* fruits 상품 등록 */
app.post('/fruits', (req, res) => {
    const { name, price, color, country } = req.body;
    if (!name || !price || !color || !country) {
        return res.status(400).json({ error: '필수항목이 누락되었습니다.' });
    }
    connection.query('INSERT INTO fruit (name, price, color, country) VALUES (?, ?, ?, ?)', [name, price, color, country], (err, result) => {
        if (err) {
            console.log('DB등록 실패 :', err);
            res.status(500).json({ error: '상품 등록 실패' });
            return;
        }
        res.json({ success: true, insertId: result.insertId });
    });
});

/* question 등록 */
app.post('/question', (req, res) => {
    const { name, tel, email, txtbox } = req.body;
    if (!name || !tel || !email || !txtbox) {
        return res.status(400).json({ error: '필수항목이 누락되었습니다.' });
    }
    //변수에 저장된 데이터를 sql쿼리문으로 DB에 입력함
    connection.query('INSERT INTO question (name, tel, email, txtbox) VALUES (?, ?, ?, ?)', [name, tel, email, txtbox], (err, result) => {
        if (err) {
            console.log('DB등록 실패 :', err);
            res.status(500).json({ error: '질문 등록 실패' });
            return;
        }
        res.send('질문 등록 완료');
    });
});

/* login 등록 */

//서버실행
app.listen(port, () => {
    console.log('Listening...');
});
