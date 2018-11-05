var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var phantom = require('phantom');
const axios = require('axios');

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
    return $(".article p").text()
  }).then(function (text) {
    console.log("TEXT PRAVDA", text, link_src)
    jsonLoc = { link_src, text }
  });
  await instance.exit();
  return jsonLoc
}

function getNewsPravda($keywords, company, id) {
  var json1 = []
  var url = "https://www.pravda.rs/naslovna/"
  request(url, async function (error, response, html) {
    if (!error) {
      var $ = cheerio.load(html);
      for (i in $keywords) {
        await $(`span:contains('${$keywords[i]}')`.toLowerCase()).each(function () {
          var text = $(this).text().replace(/[\t\n\r]/gm, '').trim()
          var lastParent = $(this).closest(':has(a)').find("a");
          var link = "https://www.pravda.rs/naslovna" + $(lastParent).attr('href');
          json1.push({ text, link })
        })

        await $(`a[href*=${$keywords[i]}]`.toLowerCase()).each(function () {
          var text = $(this).text().replace(/[\t\n\r]/gm, '').trim()
          var link = "https://www.pravda.rs/naslovna" + $(this).attr('href');
          var name = Math.random().toString(36).substring(7);
          json1.push({ text, link })
          console.log("LINK IZ PRAVDE", link)
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
            media_slug: "pravda",
            api_key: "sdsd",
            data: data
          }
        })
          .then(function (response) {
            console.log("RESPONSE FROM AXIOS PRAVDA");
          })
      )
    } else {
      console.log("EROR", error)
    }
  });
}

module.exports.getNewsPravda = getNewsPravda;
