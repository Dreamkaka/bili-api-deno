import { Application, Router } from "https://deno.land/x/oak/mod.ts";

const app = new Application();
const router = new Router();

const SESSDATA = 'SESSDATA=cdc1ee1b%2C1725825104%2C10469%2A31CjC56fJdcJHxPN83DDnjLbO9E-kMOdHFF2-X5vHRGkvTQLqkLfVwNSKF9PztioT9dagSVnBGOEF5U0lZcFVaUV94LWVhODRsR2NSeUZhVURyZDEtWFA2czBPNy13S2o4SS1Db3pXOWVoQ0V5dExVZUtYZ2NMNkJzVUxYV3o0RlNpSTNMLXJHSUVRIIEC';

// 定义路由处理程序
router.get("/ip", async (ctx) => {
  try {
    const response = await fetch("https://api.bilibili.com/x/web-interface/zone");
    const data = await response.json();
    ctx.response.body = data;
  } catch (error) {
    ctx.response.body = "Error fetching data from API";
  }
});

router.get("/url", async (ctx) => {
  const { request, response } = ctx;

  const bvid = ctx.request.url.searchParams.get('bvid');

  if (!bvid) {
    response.status = 400;
    response.body = { message: "Missing bvid" };
    return;
  }

  try {
    const pagelistUrl = `https://api.bilibili.com/x/player/pagelist?bvid=${bvid}`;
    const pagelistRes = await fetch(pagelistUrl);
    const pagelistData = await pagelistRes.json();
    
    const cid = pagelistData.data[0].cid;

    const headers= new Headers();
    headers.set('cookie', SESSDATA)

    
    const playurl = `https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&qn=80&platform=html5&high_quality=1`;

    const res = await fetch(playurl, { headers });
    const data = await res.json();
   

    response.status = 200;
    response.body = data;
  } catch (error) {
    response.status = 500;
    response.body = { message: "Error fetching data from API" };
  }
});


router.get("/player", async (ctx) => {
  const { request, response } = ctx;
  const url = request.url.searchParams.get("url");

  try {
      const matches = url.match(/BV([a-zA-Z0-9]{10})/);
      if (!matches || !matches[1]) {
          response.status = 400;
          response.body = { message: "Missing or invalid bvid" };
          return;
      }

      const bvid = matches[1];

      const pagelistUrl = `https://api.bilibili.com/x/player/pagelist?bvid=${bvid}`;
      const pagelistRes = await fetch(pagelistUrl);
      const pagelistData = await pagelistRes.json();

      if (!pagelistData || !pagelistData.data || pagelistData.data.length === 0) {
          response.status = 400;
          response.body = { message: "No pagelist data found for the provided bvid" };
          return;
      }

      const cid = pagelistData.data[0].cid;

      const playurlUrl = `https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&qn=80&platform=html5&high_quality=1`;
      const playurlRes = await fetch(playurlUrl, { headers: { 'Cookie': SESSDATA } });
      const playurlData = await playurlRes.json();

      if (!playurlData || !playurlData.data || !playurlData.data.durl || playurlData.data.durl.length === 0) {
          response.status = 400;
          response.body = { message: "No playurl data found for the provided bvid and cid" };
          return;
      }

      const mp4Url = playurlData.data.durl[0].url;

      response.redirect(mp4Url);
  } catch (error) {
      response.status = 500;
      response.body = { message: "Error fetching data from API" };
  }
});
// 将路由中间件添加到应用程序
app.use(router.routes());
app.use(router.allowedMethods());

const PORT = 8000;
console.log(`Server running on port ${PORT}`);
await app.listen({ port: PORT });