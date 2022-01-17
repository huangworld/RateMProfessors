chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch(message.action) {
    case "sendRequest":
      var xmlRequest = new XMLHttpRequest();
      xmlRequest.onreadystatechange = function(){
        if (xmlRequest.readyState == 4 && xmlRequest.status == 200){
          console.log("received response from rmp!");
          console.log(xmlRequest.responseText);
          sendResponse({doc: xmlRequest.responseText});
        }
      }
      //message.url = "https://www.ratemyprofessors.com/search/teachers?query=luke&sid=U2Nob29sLTEyNTg=";
      xmlRequest.open("GET", message.url, true);
      xmlRequest.setRequestHeader("Access-Control-Allow-Origin","*");
      xmlRequest.send();
      return true;
    default:
      alert("invalid action!");
  }
});
