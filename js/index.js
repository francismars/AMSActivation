let serverIP = "ws://170.75.162.217";
let serverPORT = "3001";
const socket = io(serverIP+":"+serverPORT, { transports : ['websocket'] });

socket.on("connect", () => {
    console.log(`connected with id: ${socket.id}`)
})

socket.emit('paylinks',"getLinks");

let payLinksDict = {}
socket.on('resPayLinks', (data) => {
	//console.log(data)
	for(let i=0;i<data.length;i++){
		//console.log(data[i])
		payLinksDict[data[i].description]={"lnurl":data[i].lnurl,"id":data[i].id}
	}	
	//console.log(payLinksDict)
	loadPayLinksDOM()
})

let qrToReplaceid = -1
function loadPayLinksDOM(){
	let withdrawalProb = 0.3
	if(Math.random()<withdrawalProb){
		let qrToReplace = Math.floor(Math.random() * 6) + 1;
		qrToReplaceid = "PayLink"+qrToReplace
		socket.emit('createWithdrawal', {"amount": 2000, "maxWithdrawals": 1});
	}
	
	for(var key in payLinksDict) {
		let value = payLinksDict[key];
		let lnurl = value.lnurl
		//console.log(key)
		//console.log(value)
		if(qrToReplaceid!=key){
			let qrcodeContainer = document.getElementById(key);
			qrcodeContainer.innerHTML = "";
			new QRious({
				element: qrcodeContainer,
				size: 800,
				value: lnurl,
				foreground: "white",
				backgroundAlpha: 0
			});
		}

	}
}

socket.on('rescreateWithdrawal', (data) => {
    console.log("LNURLID", data.id);
    console.log("LNURL", data.lnurl);
    console.log("LNURLMAXW", data.max_withdrawable);
	let qrcodeContainer = document.getElementById(qrToReplaceid);
	qrcodeContainer.innerHTML = "";
	qrcodeContainer.classList.add("qrcodeWithdrawal");

  //Add frame gif
  let gifContainer = document.getElementById(qrToReplaceid+"gif");
  gifContainer.src="images/frame.gif";

  new QRious({
		element: qrcodeContainer,
		size: 800,
		value: data.lnurl,
		foreground: "red",
		background: "orange"
	});
});

let invoicesPaidAmount = 0;
let invoicesPaidList = []
socket.on("invoicePaid", body => {
	console.log(body)
	let paidlnurlid = body.lnurlp;
	for(var key in payLinksDict) {
		let value = payLinksDict[key];
		let lnurlid = value.id
		if(lnurlid==paidlnurlid){
      let keyTemp = key
			console.log("Paid for "+keyTemp);
			let qrcodeContainer = document.getElementById(keyTemp);
      let randReward = Math.floor(Math.random() * 30) + 1;
			let gifContainer = document.getElementById(keyTemp+"gif");
			gifContainer.src="images/paidqr.gif";
      setTimeout(() => {
        qrcodeContainer.src="images/paidqrs/reward_"+randReward+".jpg";
			}, 650, qrcodeContainer);
			setTimeout(() => {
				gifContainer.src="images/transparent.png";
			}, 2000, gifContainer);
			invoicesPaidList.push(key)
			//console.log(invoicesPaidList)
			setTimeout(() => {
				qrcodeContainer.innerHTML = "";
				let keyIndex = invoicesPaidList.indexOf(keyTemp)
				//console.log(keyTemp)
				//console.log(keyIndex)
				if(keyIndex!=-1){
					invoicesPaidList.splice(keyIndex,1)
					//console.log(invoicesPaidList)
				}
				new QRious({
					element: qrcodeContainer,
					size: 800,
					value: value.lnurl,
					foreground: "white",
					backgroundAlpha: 0
				});
			}, 10000,keyTemp);
		}
	}
	invoicesPaidAmount++;
	if(invoicesPaidAmount%4==0 && qrToReplaceid==-1){
		while(true){
			let qrToReplace = Math.floor(Math.random() * 6) + 1;
			qrToReplaceid = "PayLink"+qrToReplace
			let keyIndex = invoicesPaidList.indexOf(qrToReplaceid)
			if(keyIndex==-1){
				break
			}
		}
		socket.emit('createWithdrawal', {"amount": 3000, "maxWithdrawals": 1});
	}
})

socket.on('prizeWithdrawn', (data) => {
  console.log(data)
	let value = payLinksDict[qrToReplaceid];
	let paidlnurlid = data.lnurlw;
	let qrcodeContainer = document.getElementById(qrToReplaceid);
	let gifContainer = document.getElementById(qrToReplaceid+"gif");
	qrToReplaceid = -1;
	gifContainer.src="images/paidqr.gif";
  setTimeout(() => {
    qrcodeContainer.innerHTML = "";
  	new QRious({
  		element: qrcodeContainer,
  		size: 800,
  		value: value.lnurl,
  		foreground: "white",
  		backgroundAlpha: 0
  	});
  }, 650);
	setTimeout(() => {
		gifContainer.src="images/transparent.png";
	}, 2000);

})
