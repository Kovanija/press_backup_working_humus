var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var phantom = require('phantom');
var axios = require('axios');
var async = require("async");
var extract = require('pdf-text-extract');
var hummus = require('hummus');
var path = require('path');
var convertToLat = require('cyrillic-to-latin')
const convertToCyr = require('latin-to-serbian-cyrillic')
const hasCyr = require('has-cyr');
const pdftotext = require('pdftotextjs');
const PDFDocument = require('pdfkit')
const write = require('fs-writefile-promise')


/// TAKE ALL PDF FROM SERVER CHANGE TEST FOLDER TO VALID URL 
// var testFolder = path.join(__dirname, '/source/');
// let source = []
// let keywords = ["kica"]
// let company

// function takeSource() {
//   let source = []
//   fs.readdirSync(testFolder).forEach(file => {
//     source.push(file)
//   })
//   return source
// }
// takeSource();

// if (source.length) {
//   for (let i = 0; i <= source.length - 1; i++) {
//     extractPDF(source[i],keywords,company);
//   }
// } else {
//   console.log("PRAZNO BATO")
// }
var testFolder = path.join(__dirname, '/source/');

function extractPDF(keywords, company, today) {
  console.log("KEYWORDS FROM EXCTRACT TEXT",keywords)
  let source = []
  fs.readdirSync(testFolder).forEach(file => {
    var str = file
    var n = str.startsWith(today);
    // console.log("STARTS WITH",n,today,str)
    source.push(file)
  })

  if (source.length) {
    for (let i = 0; i <= source.length - 1; i++) {
      if (typeof source[i] != 'undefined') {
        var sourcePDF = path.join(__dirname, `/source/${source[i]}`);
        var outputFolder = path.join(__dirname, '/output/');
        var keywords = keywords || [];
        
        extract(sourcePDF, (err, pages) => {
          if (err) console.log(err);
          keywords.map(word => {
            let keyword = word
            if (hasCyr(word)) {
              keyword = convertToLat(emp)
            }
            for (let i = 0; i < pages.length; i++) {
              let cyr = hasCyr(pages[i])
              if (cyr) {
                keyword = convertToCyr(keyword)
              }
              if (pages[i].toLowerCase().indexOf(keyword.toLocaleLowerCase()) !== -1) {
                var name = Math.random().toString(36).substring(7);
                var pdfWriter = hummus.createWriter(path.join(outputFolder, `${today}-${company}-${name}.pdf`));
                pdfWriter.appendPDFPagesFromPDF(sourcePDF, { type: hummus.eRangeTypeSpecific, specificRanges: [[i, i]] });
                pdfWriter.end();
                modify(keywords,today,company);
              }
            }
          });
        });
      }
    }
  }
}
// END OF  EXTRACT 
 async function modify(keywords,today,company){
  doc = new PDFDocument
  let source = []
  var outputFolder = path.join(__dirname, '/output/');
  fs.readdirSync(outputFolder).forEach(file => {
    var str = file
    var n = str.startsWith(today);
    // console.log("STARTS WITH",n,today,str)
    source.push(file)
  })
  let textArr = []
  
  for (let single of source){
    var str = single
    var n = str.startsWith(today+"-"+company);
    // console.log("STARTSS WITH",n,"NAME OF FILE",today+"-"+company )
    if (n){
      const p = takeText(single,keywords,outputFolder)
      textArr.push(p)
    }
  }

  Promise.all(textArr).then(
    data => async.map(data, writeHmtl, function(err, results) {
      console.log("A",results)
  })
  )
 }
 


async function takeText(single,keywords,outputFolder){
    let textObj
    doc = new PDFDocument
    let inputFile = path.join(outputFolder, single)
    let modified = __dirname + `/modified/${single}-modified.html`
    let pdf = new pdftotext(inputFile);
    const data = pdf.getTextSync(); // returns buffer
    let text = data.toString('utf8').toLowerCase(); // bilo je 'utf8'
    return textObj = { text: text, link:modified, keywords:keywords }
}

function writeHmtl(obj){
  let keyword = obj.keywords
  keyword.forEach( word => {
    if (hasCyr(obj.text)) {
      word = convertToCyr(word)
    }
     obj.text = obj.text.replace(new RegExp(word, 'g'),"<span style ='color:red'>" + word.toUpperCase() + "</span>")
  })
  fs.writeFile(obj.link,obj.text,function (err) {
    if (err) throw err;
      console.log('Saved!');
  }
)
}




// STRING REPLACE EXAMPLE 22222222222 OVO RADI ZA JEDAN KARAKTER
// function replaceText({filePath, patterns},name,outputFile){

//   const modPdfWriter = hummus.createWriterToModify(filePath, { modifiedFilePath:outputFile, compress: false})
// 	const numPages = modPdfWriter.createPDFCopyingContextForModifiedFile().getSourceDocumentParser().getPagesCount()
// 	for (let page = 0; page < numPages; page++) {
// 		const copyingContext = modPdfWriter.createPDFCopyingContextForModifiedFile()
// 		const objectsContext = modPdfWriter.getObjectsContext()

// 		const pageObject = copyingContext.getSourceDocumentParser().parsePage(page)
// 		const textStream = copyingContext.getSourceDocumentParser().queryDictionaryObject(pageObject.getDictionary(), 'Contents')
// 		const textObjectID = pageObject.getDictionary().toJSObject().Contents.getObjectID()
//     let data = []
//     const readStream = copyingContext.getSourceDocumentParser().startReadingFromStream(textStream)
//     console.log("READ STREAM ",readStream)
// 		while (readStream.notEnded()) {
// 			const readData = readStream.read(10000)
//       data = data.concat(readData)
//     }

//     const pdfPageAsString = Buffer.from(data).toString()
//     let toRedactString = findInText({patterns, string:pdfPageAsString})
//     const redactedPdfPageAsString = pdfPageAsString.replace(new RegExp(/a/, 'g'), "ww")

// 		// Create what will become our new text object
//     objectsContext.startModifiedIndirectObject(textObjectID)

// 		const stream = objectsContext.startUnfilteredPDFStream()
// 		stream.getWriteStream().write(strToByteArray(redactedPdfPageAsString))
// 		objectsContext.endPDFStream(stream)

// 		objectsContext.endIndirectObject()
// 	}

// 	modPdfWriter.end()
//   hummus.recrypt(outputFile,filePath)
// }

// function findInText ({patterns, string}) {
// 	for (let pattern of patterns) {
// 		const match = new RegExp(pattern, 'g').exec(string)
// 		if (match) {
//       console.log("MATCH !!!",match)
// 			if (match[1]) {
//         console.log("MATCH",match)
// 				return match[1]
// 			}
// 			else {
// 				return match[0]
// 			}
// 		}
// 	}
// 	return false
// }

// function strToByteArray (str) {
// 	let myBuffer = []
// 	let buffer = Buffer.from(str)
// 	for (let i = 0; i < buffer.length; i++) {
// 		myBuffer.push(buffer[i])
// 	}
// 	return myBuffer
// }
// END OF EXAMPLE 2222222


// TEXT EXTRACTION 






// ANOTATION RADI SAMO ZA JEDNO SLOVO/////
function replaceText(sourceFile, targetFile, pageNumber, findText, replaceText) {
  var writer = hummus.createWriterToModify(sourceFile, {
    modifiedFilePath: targetFile
  });

  var modifier = new hummus.PDFPageModifier(writer, pageNumber);
  var sourceParser = writer.createPDFCopyingContextForModifiedFile().getSourceDocumentParser();
  var pageObject = sourceParser.parsePage(pageNumber);
  var textObjectId = pageObject.getDictionary().toJSObject().Contents.getObjectID();
  var textStream = sourceParser.queryDictionaryObject(pageObject.getDictionary(), 'Contents');


  //read the original block of text data
  var data = [];
  var readStream = sourceParser.startReadingFromStream(textStream);
  while (readStream.notEnded()) {
    Array.prototype.push.apply(data, readStream.read(10000));
  }
  // var string = new Buffer(data).toString().replace(/t/g, "aa");


  //Create and write our new text object
  var objectsContext = writer.getObjectsContext();
  objectsContext.startModifiedIndirectObject(textObjectId);

  var stream = objectsContext.startUnfilteredPDFStream();
  stream.getWriteStream().write(strToByteArray(string));
  objectsContext.endPDFStream(stream);

  objectsContext.endIndirectObject();

  writer.end();
}
function strToByteArray(str) {
  var myBuffer = [];
  var buffer = new Buffer(str);
  for (var i = 0; i < buffer.length; i++) {
    myBuffer.push(buffer[i]);
  }
  return myBuffer;
}

// END OFF ANNOTATION ????????????????????????????????????????

module.exports.extractPDF = extractPDF;