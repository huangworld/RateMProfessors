console.log("content script is executed");
var currResultIdx = 0;

function highlightElement(event) {
  event.target.classList.add("suggestion");
}

function disableHighlight(event) {
  event.target.classList.remove("suggestion");
}

// For Last,First Mid, return an array containing First Last
function nameParser(name) {
  const parts = name.split(",");
  const second = parts[0];
  const ret = [];
  // malformed first name like an extra space in front of first name
  for (let i = 0; i < parts[1].split(" ").length; ++i) {
    if (parts[1].split(" ")[i].length > 0) {
      const first = parts[1].split(" ")[i];
      ret[0] = first;
      ret[1] = second;
       (first)
      return ret;
    }
  }
  
  return ret;
}

function getElementByXpath(xpath_expression) {
  return document.evaluate(
    xpath_expression,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue;
}

function createXPathFromElement(element) {
  let result_xpath = [];
  // so namespace prefix is included (if any).
  for (
    ;
    element && element.nodeType === Node.ELEMENT_NODE;
    element = element.parentNode
  ) {
    // generate index for relative xpath position
    let index = 0;
    let hasFollowingSiblings = false;
    for (
      var sibling = element.previousSibling;
      sibling;
      sibling = sibling.previousSibling
    ) {
      // Ignore document type declaration.
      if (sibling.nodeType === Node.DOCUMENT_TYPE_NODE) continue;

      if (sibling.nodeName === element.nodeName) ++index;
    }

    //generate index for class index
    let class_index = 0;
    for (
      var class_sibling = element.previousSibling;
      class_sibling;
      class_sibling = class_sibling.previousSibling
    ) {
      // Ignore document type declaration.
      if (class_sibling.nodeType === Node.DOCUMENT_TYPE_NODE) continue;

      if (class_sibling.className === element.className) ++class_index;
    }

    //whether there's sibling with respect to relative xpath
    for (
      sibling = element.nextSibling;
      sibling && !hasFollowingSiblings;
      sibling = sibling.nextSibling
    ) {
      if (sibling.nodeName === element.nodeName) hasFollowingSiblings = true;
    }

    let tagName =
      (element.prefix ? element.prefix + ":" : "") + element.localName;
    let pathIndex =
      index || hasFollowingSiblings ? "[" + (index + 1) + "]" : "";
    let class_name =
      element.classList.length > 0
        ? "{" + element.className + "," + (class_index + 1) + "}"
        : "";

    // result_xpath.splice(0, 0, tagName + pathIndex + class_name)
    result_xpath.splice(0, 0, tagName + pathIndex);
  }

  return result_xpath.length ? "/" + result_xpath.join("/") : null;
}

function sendRequest(msg) {
  var xmlRequest = new XMLHttpRequest();
	xmlRequest.open("GET", msg, true);
  xmlRequest.setRequestHeader("Access-Control-Allow-Origin","*");
	xmlRequest.send();
  xmlRequest.onreadystatechange = function(){
     (xmlRequest.status);
		if (xmlRequest.readyState == 4 && xmlRequest.status == 200){
       (xmlRequest);
			return xmlRequest.responseText;
		}
	}
}

// Function to get the nth key from the object
Object.prototype.getByIndex = function(index) {
  return this[Object.keys(this)[index]];
};

// parse the results html to find the last script tag where has the links and basic info
function parseResult(result) {
  // dummy node so we can search within response.doc
  var dummy = document.createElement("div");
  dummy.innerHTML = result; 
  scripts = dummy.getElementsByTagName("script");
  console.log(scripts.length);
  script = scripts[scripts.length - 2].innerHTML;
  script = script.split('\n')[1];
  script = script.split(" = ")[1];
  script = script.split(";")[0]
  console.log(script);
  const jsonObj = JSON.parse(script);
  const header = jsonObj.getByIndex(2);
  const numResults = header.getByIndex(5);
  console.log(numResults);
  var results = [];
  for (var key in jsonObj) {
    if (jsonObj[key].hasOwnProperty("legacyId")) {
      result = {"legacyId": jsonObj[key]["legacyId"],
                "firstName": jsonObj[key]["firstName"],
                "lastName": jsonObj[key]["lastName"],
                "avgRating": jsonObj[key]["avgRating"],
                "numRatings": jsonObj[key]["numRatings"],
                "wouldTakeAgainPercent": jsonObj[key]["wouldTakeAgainPercent"],
                "avgDifficulty": jsonObj[key]["avgDifficulty"],
                "department": jsonObj[key]["department"],
      };
      results.push(result);
    }
  }
  console.log(results.length);
  return results;
}

function ratingParser(rating) {
  
}

function showResultPanel(results, element) {
    if (currResultIdx >= results.length) {
      // reset idx to 0
      currResultIdx = 0;
    }
    result = results[currResultIdx];

    // send next request for info on the instructor's personal page
    nextUrl = "https://www.ratemyprofessors.com/ShowRatings.jsp?tid=" + result.legacyId;
    if (result.numRatings > 0) {
      chrome.runtime.sendMessage({action: "sendRequest", url: nextUrl}, function(personalPage) {
        if (personalPage == undefined) {
           ("Instructor detail page not available on RMP!");
        }
        else {
          console.log("response!")
          console.log(personalPage.doc);
          // dummy node so we can search within response.doc
          var dummy = document.createElement("div");
          dummy.innerHTML = personalPage.doc;

          if( dummy.querySelector ) {
            var ratingsList = dummy.querySelector('#ratingsList');
            var quality = ratingsList.querySelector(".kMhQxZ");
            var difficulty = ratingsList.querySelector(".cDKJcc");
            var course = ratingsList.querySelector(".gxDIt");
            var timestamp = ratingsList.querySelector(".BlaCV");
            var comment = ratingsList.querySelector(".gRjWel");
          } else {
              // Do the loop with getElementsByTagName()
              alert("querySelector not supported");
              var all = dummy.getElementsByTagName('*');

                // search for element where ID is "tester"
              for (var i = 0, len = all.length; i < len; i++) {
                  if (all[i].id === 'ratingsList') {
                      var ratingsList = all[i];
                      break;
                  }
              }
              alert( ratingsList.id );
              var ratingsList = dummy.querySelector('#ratingsList');
              var quality = ratingsList.querySelector(".kMhQxZ");
              var difficulty = ratingsList.querySelector(".cDKJcc");
              var course = ratingsList.querySelector(".gxDIt");
              var timestamp = ratingsList.querySelector(".BlaCV");
              var comment = ratingsList.querySelector(".gRjWel");
          }
        }
        // show results both basic and advanced
        panel = document.createElement("div");
        // TODO: add buttons
        // if (results.length > 1 && currResultIdx != 0) {
        //   continue;
        // }
        // if (results.length > 1 && currResultIdx != results.length - 1) {
        //   continue;
        // }
        panel.innerHTML = "<b>Basic Info: </b><br />" + result.firstName + " " + result.lastName +
                          "<br />Department: " + result.department +
                          "<br />Average Rating: " + result.avgRating +
                          "<br />Number of Ratings " + result.numRatings +
                          "<br /> " + result.wouldTakeAgainPercent + "% people would take again";
    
        
        panel.classList.add("rmpPanel");
        panel.innerHTML += "<br /><br /><b>Most Recent Review:</b> <br />Course: " + course.textContent + " Time: " + timestamp.textContent +
                            "<br />Quality: " + quality.textContent + " Difficulty: " + difficulty.textContent +
                            "<br />Comment: " + comment.textContent + "<br /><br />";
        var aTag = document.createElement("a");
        aTag.setAttribute("href", nextUrl);
        aTag.innerHTML = "<b>View More<b>";
        panel.appendChild(aTag);
        element.appendChild(panel);
      }
      
      );
      
    } else {
      // show results both basic
      panel = document.createElement("div");
      panel.innerHTML = "<b>Basic Info: </b><br />" + result.firstName + " " + result.lastName +
                        "<br />Department: " + result.department +
                        "<br />Average Rating: " + result.avgRating +
                        "<br />Number of Ratings " + result.numRatings +
                        "<br /> " + result.wouldTakeAgainPercent + "% people would take again";
      panel.classList.add("rmpPanel");
      var aTag = document.createElement("a");
      aTag.setAttribute("href", nextUrl);
      aTag.innerHTML = "<b>View More<b>";
      panel.appendChild(aTag);
      element.appendChild(panel);
    }
}

// when clicking a name, remove highlight + parse name + send name to background.js
function clickHandler(event) {
  if (event.target.parentNode.classList.contains("col-sm-3") == false || event.target.tagName !== "A") {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  console.log(event);
  disableHighlight(event);
  
  const professorName = nameParser(event.target.textContent);
  const searchUrl = "https://www.ratemyprofessors.com/search/teachers?query=" + professorName[0] + "%" + professorName[1] + 
                    "&sid=U2Nob29sLTEyNTg=";
  chrome.runtime.sendMessage({action: "sendRequest", url: searchUrl}, function(response) {
    if (response == undefined) {
       ("Instructor info not available on RMP!");
    }
    else {
      results = parseResult(response.doc);
      showResultPanel(results, event.target);
      
    }
  });

}

// highlight the text being hovered over
function hoverHandler(event) {
  console.log(event);
  if (event.target.parentNode.classList.contains("col-sm-3") == false || event.target.tagName !== "A") {
    return;
  }
  highlightElement(event);
}

function mouseOutHandler(event) {
  console.log(event);
  disableHighlight(event);
}

window.addEventListener("mouseover", hoverHandler, true);
window.addEventListener("mouseout", mouseOutHandler, true);
window.addEventListener("click", clickHandler, true);