let config = {};
let stage = null;

let parameters = {};

let user = {};
let subreddits = [];
let saved = [];

async function getJson(url, options={}) {
    let object = await fetch(url, options);
    let json = await object.json();

    return json
}

async function authenticatedRequest(url) {
    options = {
        headers: {"Authorization": `Bearer ${parameters["access_token"]}`}
    }

    let json = await getJson(url, options);
    return json;
}

async function downloadFullListing(endpoint) {
    let lastDownloaded = null;
    let finished = false;

    let listing = [];

    while (!finished) {
        const url = `${endpoint}?limit=100&after=${lastDownloaded}`;
        let json = await authenticatedRequest(url);
        let children = json["data"]["children"];
        
        listing = listing.concat(children);
        
        lastDownloaded = json["data"]["after"]
        
        if (children.length != 100) {
            finished = true;
        }
    }

    return listing;
}

async function loadConfig() {
    config = await getJson("/config.json");
}

async function setStage() {
    switch(stage) {
        case "start":
            document.getElementById("start_div").style.display = "block";
            break;
        case "wait":
            document.getElementById("wait_div").style.display = "block";

            parseUrlParameters();
            downloadInfo();

            break;
    }
}

async function findInitialStage() {
    if (location.hash == "") {
        stage = "start";
    }
    else {
        stage = "wait";
    }

    setStage();
}

function parseUrlParameters() {
    location.hash.split("#")[1].split("&").forEach(
    function(parameter) {
        parameters[parameter.split("=")[0]] = parameter.split("=")[1];
    });
}

async function downloadInfo() {
    // Download user
    user = await authenticatedRequest("https://oauth.reddit.com/api/v1/me");

    // Download subreddits
    subreddits = await downloadFullListing("https://oauth.reddit.com/subreddits/mine/subscriber");

    // Download saved
    saved = await downloadFullListing(`https://oauth.reddit.com/user/${user.name}/saved`);
}

function generateAuthUrl() {
    const client_id = config["client_id"];
    let scope = config["scope"];
    const duration = "temporary";
    const redirect_uri = encodeURIComponent("http://localhost:8080");
    const response_type = "token";
    const state = crypto.randomUUID();

    return `https://www.reddit.com/api/v1/authorize?client_id=${client_id}&duration=${duration}&redirect_uri=${redirect_uri}&response_type=${response_type}&scope=${scope}&state=${state}`;
}

function signInButton() {
    window.location = generateAuthUrl();
}

window.onload = async function () {
    await loadConfig();
    findInitialStage();
}