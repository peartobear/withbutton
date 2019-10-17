/*

<div class="withbutton"
litecoin-addr = "placeholder123"
pairID = "LTC/BTC"
orderSide = "buy"
invoiceAmount = "100000">
</div>

*/

var bitcoin_js = window.require('bitcoinjs-lib')

var boltzApiUrl = "https://testnet.boltz.exchange/api"

var invoiceExpired = false;
var expiryInterval;

var qrCode;
var modal = document.querySelector(".modal")
var close = document.querySelector(".close")
var paywithlightning = document.getElementById('pay');
var elem = document.getElementById("bar");

var elemDefault = elem.innerHTML;
var elemDefaultStyles = elem.style;


if (typeof localStorage === "undefined" || localStorage === null) {
    var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
}

if (typeof localStorage === "undefined" || localStorage === null) {
    var LocalStorage = require('node-localstorage').LocalStorage;
    localStorage = new LocalStorage('./scratch');
}

const myConfig = 
{
    pairId: "LTC/BTC",
    orderSide: "buy",
    invoiceAmount: 10000,
    claimPublicKey: "a9142f7150b969c9c9fb9094a187f8fb41d617a65e20876300670171b1752102e317e5607e757e9c4448fe458876d7e361222d2cbee33ece9e3a7b2e2359be4d68ac"
}




function createQRCode() {
    var invoiceLength = 26;
    
    var qr = qrcode(26, "L");
    
    qr.addData(localStorage.getItem('data'));
    qr.make();
    
    qrCode = qr.createImgTag(6, 6);
}

function showQRCode() {
    var element = document.getElementById("qrcode");
    
    createQRCode();
    
    element.innerHTML = qrCode;
    
    var size = "200px";
    
    var qrElement = element.children[0];
    
    qrElement.style.height = size;
    qrElement.style.width = size;
    
}

function claimSwap() {
    console.log(bitcoin_js)
}

claimSwap();

function listenToEventSource(swapId) {
    var eventSource = new EventSource(boltzApiUrl + "/streamswapstatus?id=" + swapId);

    eventSource.onmessage = function(event) {
        console.log("Swap swap event: " + event.data);

        const eventData = JSON.parse(event.data);

        if (eventData.status === "invoice.settled") {
            localStorage.setItem('preimage', eventData.preimage);
        }
    }
}

function createreverseswap(config) {
    var request = new XMLHttpRequest();
    
    request.onreadystatechange = function() {
        if (request.readyState === 4) { 
            try {
                var json = JSON.parse(request.responseText);
                if (request.status === 201) {
                    localStorage.setItem('data', json.invoice)
                    showQRCode();

                    listenToEventSource(json.id);
                } 
            } catch (exception) {
                console.error(exception)
            }
        }  
    };
    
    request.open('POST', boltzApiUrl + '/createreverseswap', true);
    request.setRequestHeader('Content-Type', 'application/json');   
    request.send(JSON.stringify(config));
}


//copying the invoice on clicking the copy button

var copyBtn = document.getElementById("copy-btn")
var copyInvoice = localStorage.getItem('data');
copyBtn.addEventListener("click", function(){
    copyInvoice.select();
    copyInvoice.setSelectionRange(0, 99999) //for mobile devices
    document.execCommand("copy")
    copyBtn.innerHTML("Copied!")    
    
})

// imvoice countdown

function startExpiryCountdown() {
    width = 1;
    expiryInterval = setInterval(frame, 200);
    function frame() {
        if (width >= 100) {
            clearInterval(expiryInterval);
            expiryInterval = undefined;
            
            invoiceExpired = true;
            
            elem.style.background = '#FD7373';
            elem.innerHTML = 'invoice expired';
            elem.style.color = "#fff"; 
        } else {
            width++;
            elem.style.width = width + '%'
        }
    }   
}


/*  if ((paywithlightning.clicked == true) && (elem.style.background = '#FD7373')) {
    clearInterval(window.id);
    elem.style.width = '1%'
    move();
}  else if (paywithlightning.clicked == false) { move() } 
else { return false } */




// creating a dialog

window.onload = function(){
    (function() {
        createreverseswap(myConfig); 
        paywithlightning.addEventListener("click", function() {
            modal.style.display = "inline-block"
            
            if (invoiceExpired) {
                elem.innerHTML = elemDefault;
                elem.style = elemDefaultStyles;
            }
            
            if (expiryInterval === undefined) {
                startExpiryCountdown();
            }
        })
        
        close.addEventListener("click", function() {
            modal.style.display = "none";
        })
        
        
    })();
    
}

