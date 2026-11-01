# Demo MiniAcc

App kế toán mini có 10 bug cài sẵn, dùng để kiểm tra / đánh giá các agent exploratory testing. KHÔNG dùng làm code tham khảo.

```
cd qa-exploratory && npm install && npm i express
node demo/miniacc-app/server.js            # http://localhost:4100
tools/start-browsers.sh http://localhost:4100 8931 8932 8933
```
Khi cho agent chạy thật, di chuyển `demo/miniacc-app/` (đặc biệt ANSWER_KEY.md) ra khỏi máy chạy agent để test công bằng.
