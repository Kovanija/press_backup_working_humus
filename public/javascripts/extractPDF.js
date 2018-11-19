var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var phantom = require('phantom');
var async = require("async");
var extract = require('pdf-text-extract');
var hummus = require('hummus');
var path = require('path');
var convertToLat = require('cyrillic-to-latin')
const convertToCyr = require('latin-to-serbian-cyrillic')
const hasCyr = require('has-cyr');
const pdftotext = require('pdftotextjs');
const PDFDocument = require('pdfkit')


/// TAKE ALL PDF FROM SERVER CHANGE TEST FOLDER TO VALID URL 
var testFolder = path.join(__dirname, '/source/');

function extractPDF(keywords1, company, today, id) {
  let sourceArr = []
  // READ ALL SOURCES FROM SOURCE FOLDER AND PUSH IN ARR
  fs.readdirSync(testFolder).forEach(file => {
    sourceArr.push(file)
  })

  if (sourceArr.length) {
    for (let i = 0; i < sourceArr.length; i++) {
      // FOR EACH SOURCE START FUNCTION TO EXTRACT SINGLE PAGE WHERE KEYWORD EXIST
      try {
        extractA(sourceArr[i], keywords1, company, today, id);
      }
      catch (e) {
        // handle the unsavoriness if needed
      }
    }
  }
}

function extractA(source, keywords1, company, today, id) {
  if (typeof source != 'undefined') {
    var sourcePDF = path.join(__dirname, `/source/${source}`);
    var outputFolder = path.join(__dirname, '/output/');
    var keywords = keywords1 || [];

    try {
      extract(sourcePDF, (err, pages) => {
        if (err) console.log(err);
        for (let i = 0; i < pages.length; i++) {
          let keywordsConverted = keywords1
          // CHECKING IF PAGES ON PDF ARE ON CYRILIC IF THEY ARE WE CONVERT KEYWORDS TO CYRILIC
          let cyr = hasCyr(pages[i])
          if (cyr) {
            keywordsConverted = keywords.map(word => convertToCyr(word))
          }
          if (keywordsConverted.some(function (v) { return pages[i].toLowerCase().indexOf(v.toLocaleLowerCase()) >= 0; })) {
            var name = Math.random().toString(36).substring(10);
            var pdfWriter = hummus.createWriter(path.join(outputFolder, `${today}|${company}|${id}|${source}|${name}.pdf`));
            pdfWriter.appendPDFPagesFromPDF(sourcePDF, { type: hummus.eRangeTypeSpecific, specificRanges: [[i, i]] });
            pdfWriter.end();
            // CALL MODIFY() TO CREATE A HTML FROM SINGLE PDF 
            modify(keywords, today, company);
          }
        }
      });
    } catch (e) {
      // handle the unsavoriness if needed
    }
  }
}
// END OF  EXTRACT 

async function modify(keywords, today, company) {
  doc = new PDFDocument
  let source = []
  var outputFolder = path.join(__dirname, '/output/');

  fs.readdirSync(outputFolder).forEach(file => {
    var str = file
    var n = str.startsWith(today);
    source.push(file)
  })
  let textArr = []

  for (let single of source) {
    // CREATE HTML ONLY FOR PDFS THAT ARE EXTRACTED TODAY
    var str = single
    var n = str.startsWith(today + "|" + company);
    if (n) {
      const p = takeText(single, keywords, outputFolder)
      textArr.push(p)
    }
  }
  Promise.all(textArr).then(
    data => async.map(data, writeHmtl, function (err, results) {
    })
  )
}

async function takeText(single, keywords, outputFolder) {
  let textObj
  doc = new PDFDocument
  let inputFile = path.join(outputFolder, single)
  let modified = __dirname + `/modified/${single}-modified.html`
  let pdf = new pdftotext(inputFile);
  const data = pdf.getTextSync(); // returns buffer
  let text = data.toString('utf8').toLowerCase(); // bilo je 'utf8'

  return textObj = { text: text, link: modified, keywords: keywords }
}

function writeHmtl(obj) {
  
  let foundKeywords = "<div>";
  let keyword = obj.keywords
  keyword.forEach(word => {
    if (hasCyr(obj.text)) {
      word = convertToCyr(word)
    }
    var check = obj.text.includes(word);
    if(check)
      foundKeywords += word + ", ";
    obj.text = obj.text.replace(new RegExp(word, 'g'), "<span style ='color:red'><b>" + word.toUpperCase() + "</b></span>")
  })
    foundKeywords += "</div>";
    obj.text = foundKeywords + obj.text;
  fs.writeFile(obj.link, obj.text, function (err) {
    if (err) throw err;
  }
  )
}

module.exports.extractPDF = extractPDF;
