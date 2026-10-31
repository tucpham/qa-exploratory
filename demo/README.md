# Demo MiniAcc

App kế toán mini có 10 bug cài sẵn, dùng để kiểm tra / huấn luyện QA bot. KHÔNG dùng làm code tham khảo.

```
cd dtvn-qa-bot && npm install && npm i express
node demo/miniacc-app/server.js            # http://localhost:4100
tools/start-browsers.sh http://localhost:4100 8931 8932 8933
```
Khi cho bot chạy thật, di chuyển `demo/miniacc-app/` (đặc biệt ANSWER_KEY.md) ra khỏi máy chạy bot để test công bằng.
