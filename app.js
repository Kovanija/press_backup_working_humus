var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var screpBlic = require('./public/javascripts/getDataBlic.js')
var screp24 = require('./public/javascripts/getData24.js')
var screpB92 = require('./public/javascripts/getDataB92.js')
var screpKurir = require('./public/javascripts/getDataKurir.js')
var screpDanas = require('./public/javascripts/getDataDanas.js')
var screpInformer = require('./public/javascripts/getDataInformer.js')
var screpPolitika = require('./public/javascripts/getDataPolitika.js')
var screpAlo = require('./public/javascripts/getDataAlo.js')
var screpNovosti = require('./public/javascripts/getDataNovosti.js')
var screpPravda = require('./public/javascripts/getDataPravda.js')
var extractPDF = require('./public/javascripts/extractPDF.js')
const axios = require('axios');
var ontime = require('ontime')
var fs = require('fs');


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users/', usersRouter);

// let arr = []
// let routes = `${domain_name}/javascripts/modified/${namePDF}`

// app.get('/pdfs',express.static(__dirname + `/javascripts/modified/1c4vkn.pdf-modified.pdf`))

// app.get('/pdfs/:name',function (req, res, next) {
//   console.log("PARAMATERS",req.params)
//   // res.render('pdfs',{ title: 'PDFS',name:req.params.name });
//   return express.static(__dirname + `/javascripts/modified/${req.param.name}.pdf`)
// })

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// ONTIME IS NODE LIB FOR CRONE JOBS
/// PORTALS FOR SCREPPING , CRONE JOBS DIVIDED IN 3 CRONE JOBS FOR BETER PERFORMANCE
// SET DIFFERENT TIME FOR EACH CRONE

ontime({
  cycle: [ '02:48:00' ]
}, function (ot) {
  axios.get('https://press-clip-new.herokuapp.com/api/companies?api_key=23')
  .then( async response =>{
    if (response.data.success == true) {
      let companies = response.data.company
      companies.map(company => {
         let keywords = [] 
         company.keywords.map( word => keywords.push(word.name))
            screpNovosti.getNewsNovosti(keywords,company.name,company.id)
            screpPolitika.getNewsPolitika(keywords,company.name,company.id)
            screpBlic.getNewsBlic( keywords,company.name,company.id)
            screp24.getNews24( keywords,company.name,company.id )
      })
    }
  })
  .catch(error => {
    console.log(error);
  });
  ot.done()
  return
})


ontime({
  cycle: [ '11:59:00' ]
}, function (ot) {
  console.log("CRONE JOB")
  axios.get('https://press-clip-new.herokuapp.com/api/companies?api_key=23')
  .then( async response => {
    if (response.data.success == true) {
      let companies = response.data.company
      companies.map(company => {
         let keywords = [] 
         company.keywords.map( word => keywords.push(word.name))
          screpInformer.getNewsInformer( keywords,company.name,company.id)
          screpAlo.getNewsAlo( keywords,company.name,company.id)
          screpPravda.getNewsPravda( keywords,company.name,company.id)
      })
    }
  })
  .catch(error => {
    console.log(error);
  });
  ot.done()
  return
})

ontime({
  cycle: [ '02:56:00' ]
}, function (ot) {
  console.log("CRONE JOB")
  axios.get('https://press-clip-new.herokuapp.com/api/companies?api_key=23')
  .then( async response => {
    if (response.data.success == true) {
      let companies = response.data.company
      companies.map(company => {
         let keywords = [] 
         company.keywords.map( word => keywords.push(word.name))
          screpKurir.getNewsKurir( keywords,company.name,company.id )
          screpDanas.getNewsDanas( keywords,company.name,company.id)
          screpB92.getNewsB92(keywords,company.name,company.id )
      })
    }
  })
  .catch(error => {
    console.log(error);
  });
  ot.done()
  return
})
// ----------END OF CRONE JOBS FOR PORTALS ------------//



// ----PDF HANDLING CRONE JOB FOR FETCHING COMPANIES AND CREATING PDFS----///
// --- CRONE JOB CALLS EXTRACTPDF FUNCTION WHICH GO TROUGHT EACH FILE IN SOURCE FOLDER AND 
// ---- EXTRACT SINGLE PAGE FOR EACH COMPANIE BY GIVEN KEYWORD
// --- FINISHTIME OF EXTRACTPDF FUNCTION DEPENDS OF AMOUNT OF FILES IN SOURCE FOLDER AND NUMBER OF COMPANIES

ontime({
  cycle: [ '12:58:00' ]
}, function (ot) {
  axios.get('https://press-clip-new.herokuapp.com/api/companies?api_key=23')
  .then( async response => {
    if (response.data.success == true) {
         let today = new Date();
         let datestring = today.getDate().toString()+"-"+(today.getMonth()+1)+"-"+today.getFullYear()
        let companies = response.data.company
        companies.map(company => {
          let keywords = [] 
            company.keywords.map( word => keywords.push(word.name))
            extractPDF.extractPDF(keywords,company.name,datestring,company.id)
      })
    }
  })
  .catch(error => {
    console.log(error);
  });
  ot.done()
  return
})


//----                    !!!IMPORTANT            ----///
//--- CRONE JOB FOR COLLECTING AND SENDING ROUTES OF EXTRACTED SINGLE PDF FILES AND HTML FILES--//
//--- TIME OF THIS CRONE JOB SHOULD SYNC WITH  CRONE JOB ABOVE,MUST WAIT CORNE JOB ABOVE TO FINISH--//
//--- IT READS FILES FROM PUBLIC/OUTPUT/ FOLDER AND AFTER SENDS AXIOS.POST --//

ontime({
  cycle: [ '12:59:00' ]
}, function (ot) {
  let today = new Date();
  let pdfSingleArr = []
  let singlePdfSource = path.join(__dirname, '/public/javascripts/output/')
  let datestring = today.getDate().toString()+"-"+(today.getMonth()+1)+"-"+today.getFullYear()
    
   fs.readdirSync(singlePdfSource).forEach(file => {
    let str = file
    let n = str.startsWith(datestring);
    if(n){
      let splitSource= file.split("|")
      let sourceName = splitSource[3]
      pdfSingleArr.push({
        single_page_src:file,
        modified_src:file +"-modified.html",
        original_src:sourceName
      })
    }
    })
    Promise.all(pdfSingleArr).then(
      data => 
      axios({
       method:'POST',
       url:'https://press-clip-new.herokuapp.com/api/printed?api_key=23',
       data:{
        api_key:"sdsd",
        data:data
        }
     })
     .then(function (response) {
       console.log("RESPONSE",response);
     })
    )
  ot.done()
  return
})

app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
