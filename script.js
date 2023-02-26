let config = {};

async function getJson(url, options={}) {
    let object = await fetch(url, options);
    let json = await object.json();

    return json
}

async function loadConfig() {
    config = await getJson("/config.json");
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
    console.log(config["client_id"]);
}