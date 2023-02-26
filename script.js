let config = {};
let stage = null;

let parameters = {};

let user = {};
let subreddits = [];
let saved = [];
let hidden = [];

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

async function downloadFullListing(endpoint, updateDomListingCounter=false) {
    let lastDownloaded = null;
    let finished = false;

    let listing = [];

    while (!finished) {
        const url = `${endpoint}?limit=100&after=${lastDownloaded}`;
        let json = await authenticatedRequest(url);
        let children = json["data"]["children"];
        
        listing = listing.concat(children);
        
        if (updateDomListingCounter) {
            document.getElementById("listing_counter").textContent = `(${listing.length})`;
        }

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
    document.getElementById("start_div").style.display = "none";
    document.getElementById("wait_div").style.display = "none";
    document.getElementById("overview_div").style.display = "none";
    
    switch(stage) {
        case "start":
            document.getElementById("start_div").style.display = "block";
            break;
        
        case "wait":
            document.getElementById("wait_div").style.display = "block";

            parseUrlParameters();
            await downloadInfo();
            
            stage = "overview";
            setStage();

            break;

        case "overview":
            document.getElementById("overview_div").style.display = "block";

            document.getElementById("overview_title").textContent = `Welcome, ${user.name}!`;
            document.getElementById("overview_loaded_count").textContent = `Loaded ${subreddits.length} subreddits, ${saved.length} saved and ${hidden.length} hidden.`;

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

    if (parameters["error"]) {
        window.location = generateAuthUrl();
    }
}

async function downloadInfo() {
    // Download user
    document.getElementById("processing_waiting_text").textContent = "Processing user info";
    document.getElementById("listing_counter").textContent = "";
    user = await authenticatedRequest("https://oauth.reddit.com/api/v1/me");

    // Download subreddits
    document.getElementById("processing_waiting_text").textContent = "Processing subreddits ";
    document.getElementById("listing_counter").textContent = "(0)";
    subreddits = await downloadFullListing("https://oauth.reddit.com/subreddits/mine/subscriber", updateDomListingCounter=true);

    // Download saved
    document.getElementById("processing_waiting_text").textContent = "Processing saved ";
    document.getElementById("listing_counter").textContent = "(0)";
    saved = await downloadFullListing(`https://oauth.reddit.com/user/${user.name}/saved`, updateDomListingCounter=true);

    // Download hidden
    document.getElementById("processing_waiting_text").textContent = "Processing hidden ";
    document.getElementById("listing_counter").textContent = "(0)";
    hidden = await downloadFullListing(`https://oauth.reddit.com/user/${user.name}/hidden`, updateDomListingCounter=true);
}

function generateDataJson() {
    return {"user": user, "time": Math.round(Date.now() / 1000), "version": config["version"], "data": {"subreddits": subreddits, "saved": saved, "hidden": hidden}};
}

function downloadStringAsFile(string, fileName) {
    const blob = new Blob([string], {type: "text/plain"});
    const hyperlink = document.createElement("a");

    hyperlink.download = fileName;
    hyperlink.href = URL.createObjectURL(blob);
    hyperlink.click();
}

function saveToDiskButton() {
    const dataString = JSON.stringify(generateDataJson());
    const fileName = `${user.name}_${Math.round(Date.now() / 1000)}.json`;

    downloadStringAsFile(dataString, fileName);
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