const sheetObject = getsSheetObject();
const lastIdRow = sheetObject.getLastRow();
const lastId = sheetObject.getRange(lastIdRow, 4).getValue();

function myFunction() {
    const getUrl = PropertiesService.getScriptProperties().getProperty('SCRAPE_URL');
    const data = scraping(getUrl);
    const reversedData = data.reverse();

    reversedData.forEach(function (datum) {
        const result = regularExpression(datum);
    });

    console.log('end');

}

function regularExpression(datum) {
    const lastRow = sheetObject.getLastRow();

    let myRegexp = /<div class="title">([\s\S]*?)<\/div>/;
    const title = datum.match(myRegexp);
    const titleRegexp = title[1].replace(/<("[^"]*"|'[^']*'|[^'">])*>/g, '');
    const urlRegexp = /https?:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+/g;
    const url = title[1].match(urlRegexp);

    const id = url[0].replace(/[^0-9]/g, '');

    if (id <= lastId) {
        return;
    }

    setValueSheet(lastRow + 1, 1, url);
    setValueSheet(lastRow + 1, 2, titleRegexp);
    setValueSheet(lastRow + 1, 4, id);

    myRegexp = /<div class="body">([\s\S]*?)<\/div>/;
    const body = datum.match(myRegexp);
    const bodyRexexp = body[1].replace(/<("[^"]*"|'[^']*'|[^'">])*>/g, '');
    setValueSheet(lastRow + 1, 3, bodyRexexp);
    sendSlack(bodyRexexp, titleRegexp, url);

}

/**
 * spread sheet に値を入力する
 */
function setValueSheet(row, column, content) {
    const range = sheetObject.getRange(row, column);
    range.setValue(content);
}

/**
 * sheet object を返す。
 */
function getsSheetObject() {
    const spreadSheetUrl = PropertiesService.getScriptProperties().getProperty('SHEET_URL');
    const spreadSheetObject = SpreadsheetApp.openByUrl(spreadSheetUrl);
    const sheetObject = spreadSheetObject.getActiveSheet();
    return sheetObject
}

function scraping(url) {
    const html = UrlFetchApp.fetch(url).getContentText('UTF-8');
    const data = Parser.data(html).from('<div class="bosyuList__card">').to('<div class="container bosyu_suggest">').iterate();

    return data;
}

function sendSlack(datum, title, url) {
    const postUrl = PropertiesService.getScriptProperties().getProperty('SLACK_HOOK_URL');
    const username = title;
    const icon = ':hatching_chick:';
    const message = datum + '\n' + url;
    const jsonData = {
        "username": username,
        "icon_emoji": icon,
        "text": message
    };
    const payload = JSON.stringify(jsonData);

    const options = {
        "method": "post",
        "contentType": "application/json",
        "payload": payload
    };

    UrlFetchApp.fetch(postUrl, options);
}