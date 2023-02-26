let config = {};
let stage = null;

let parameters = {};

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