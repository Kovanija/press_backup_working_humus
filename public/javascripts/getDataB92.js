var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var phantom = require('phantom');
var axios = require('axios');

// takeScreenShot = async (url, name) => {
//   const instance = await phantom.create();
//   const page = await instance.createPage();
//   const status = await page.open(url)
//   await page.render(`public/images/${name}`)
//   await instance.exit()
// }

// EXTRACT TEXT WHEN URL IS FINDED

async function takeText(link_src, company, id) {
  let jsonLoc
  const instance = await phantom.create();
  const page = await instance.createPage();
  await page.on('onResourceRequested', function (requestData) {
    // console.info('Requesting', requestData.url);
  });
  const status = await page.open(link_src);
  const content = await page.property('content');
  await page.evaluate(function () {
    return $("#article-content p").text()
  }).then(function (text) {
    jsonLoc = { link_src, text }
  });
  await instance.exit();
  return jsonLoc
}

function getNewsB92($keywords, company, id) {
  console.log("KEYWORDS", $keywords)
  var json1 = []
  var url = "https://www.b92.net/"
  // var keyword = req.body.keyword.split(' ').join('-')
  request(url, async function (error, response, html) {
    if (!error) {
      var $ = cheerio.load(html);
      for (i in $keywords) {
        await $(`h4:contains('${$keywords[i]}')`.toLowerCase()).each(function () {
          var text = $(this).text().replace(/[\t\n\r]/gm, '').trim()
          var lastParent = $(this).closest(':has(a)').find("a");
          var link = $(lastParent).attr('href').startsWith("https") ? $(lastParent).attr('href') : ("https://www.b92.net" + $(lastParent).attr('href'));
          json1.push({ text, link })
          console.log("LINK H4")
        })
        await $(`h3:contains('${$keywords[i]}')`.toLowerCase()).each(function () {
          var text = $(this).text().replace(/[\t\n\r]/gm, '').trim()
          var lastParent = $(this).closest(':has(a)').find("a");
          var link = $(lastParent).attr('href').startsWith("https") ? $(lastParent).attr('href') : ("https://www.b92.net" + $(lastParent).attr('href'));
          json1.push({ text, link })
          console.log("NASAO H3")
        })
        await $(`h2:contains('${$keywords[i]}')`.toLowerCase()).each(function () {
          var text = $(this).text().replace(/[\t\n\r]/gm, '').trim()
          var lastParent = $(this).closest(':has(a)').find("a");
          var link = $(lastParent).attr('href').startsWith("https") ? $(lastParent).attr('href') : ("https://www.b92.net" + $(lastParent).attr('href'));
          json1.push({ text, link })
          console.log("NASAO H2")
        })
        await $(`p:contains('${$keywords[i]}')`.toLowerCase()).each(function () {
          console.log("NASAO P")
          var text = $(this).text().replace(/[\t\n\r]/gm, '').trim()
          var lastParent = $(this).closest(':has(a)').find("a");
          var link = $(lastParent).attr('href').startsWith("https") ? $(lastParent).attr('href') : ("https://www.b92.net" + $(lastParent).attr('href'));
          json1.push({ text, link })
        })

        await $(`a:contains('${$keywords[i]}')`.toLowerCase()).each(function () {
          console.log("CONTAINS A KEYWORD")
          var text = $(this).text().replace(/[\t\n\r]/gm, '').trim()
          var link = $(this).attr('href').startsWith("https") ? $(this).attr('href') : ("https://www.b92.net" + $(this).attr('href'));
          var name = Math.random().toString(36).substring(7);
          json1.push({ text, link })
          //  PHANTOM JS SCREENSHOOT
          // takeScreenShot(link, name +".png");
        })
      }
       // REMOVE DUPLICATE LINKS
      var result = json1.reduce((unique, o) => {
        if (!unique.some(obj => obj.link === o.link)) {
          unique.push(o);
        }
        return unique;
      }, []);

      const promises = []

      for (link of result) {
        const f = takeText(link.link, company, id)
        promises.push(f)
      }

      Promise.all(promises).then(
        data => axios({
          method: 'POST',
          url: 'https://press-cliping.herokuapp.com/api/digitals',
          data: {
            company_id: id,
            media_slug: "b92",
            api_key: "sdsd",
            data: data
          }
        })
          .then(function (response) {

          })
      )
    } else {
      console.log("EROR", error)
    }
  });
}

module.exports.getNewsB92 = getNewsB92;
