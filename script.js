let config = {};
let stage = null;

let parameters = {};

let user = {};
let subreddits = [];
let saved = [];
let hidden = [];

let loadedUser;
let loadedTime;
let loadedVersion;
let loadedSubreddits;
let loadedSaved;
let loadedHidden;

async function getJson(url, options={}) {
    let object = await fetch(url, options);
    let json = await object.json();

    return json
}

async function authenticatedRequest(url, options={}) {
    options["headers"] = {"Authorization": `Bearer ${parameters["access_token"]}`}

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
    document.getElementById("file_div").style.display = "none";
    document.getElementById("file_overview_div").style.display = "none";
    document.getElementById("backup_restoring_div").style.display = "none";
    document.getElementById("finished_restoring_div").style.display = "none";
    
    switch(stage) {
        case "start":
            document.getElementById("start_div").style.display = "block";

            break;
        
        case "wait":
            document.getElementById("wait_div").style.display = "block";

            parseUrlParameters();
            await downloadInfo();
            
            switchStage("overview");

            break;

        case "overview":
            document.getElementById("overview_div").style.display = "block";

            document.getElementById("overview_title").textContent = `Welcome, ${user.name}!`;
            document.getElementById("overview_loaded_count").textContent = `Loaded ${subreddits.length} subreddits, ${saved.length} saved and ${hidden.length} hidden.`;

            break;

        case "file":
            document.getElementById("file_div").style.display = "block";

            break;

        case "file_overview":
            document.getElementById("file_overview_div").style.display = "block";

            document.getElementById("file_subreddits_checkbox").checked = false;
            document.getElementById("file_saved_checkbox").checked = false;
            document.getElementById("file_hidden_checkbox").checked = false;

            break;

        case "backup_restoring":
            document.getElementById("backup_restoring_div").style.display = "block";
            
            await restoreBackup();
            switchStage("finished_restoring");
        
            break;

        case "finished_restoring":
            document.getElementById("finished_restoring_div").style.display = "block";
        
            break;
    }
}

async function findInitialStage() {
    if (location.hash == "") {
        switchStage("start");
    }
    else {
        switchStage("wait");
    }
}

function parseUrlParameters() {
    location.hash.split("#")[1].split("&").forEach(
    function(parameter) {
        parameters[parameter.split("=")[0]] = parameter.split("=")[1];
    });

    if (parameters["error"]) {
        switchStage("start");
    }
}

async function downloadInfo() {
    // Download user
    document.getElementById("processing_waiting_text").textContent = "Processing user info";
    document.getElementById("listing_counter").textContent = "";
    try {
        user = await authenticatedRequest("https://oauth.reddit.com/api/v1/me");
    }
    catch {
        let errorMessage = "";
        errorMessage += "Request to Reddit API failed. \n"
        errorMessage += "Make sure you're not using any ad-blocking extensions or privacy/tracking protections. \n"
        errorMessage += "Especially if you're using a privacy-friendly browser like Firefox or Brave. \n\n"
        errorMessage += "RedditManager is open-source and doesn't steal your data. \n\n"
        errorMessage += "Disable this software and try again."

        alert(errorMessage);

        switchStage("start");
    }

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

async function restoreBackup() {
    // Get configuration
    const restoreSubreddits = document.getElementById("file_subreddits_checkbox").checked;
    const restoreSaved = document.getElementById("file_saved_checkbox").checked;
    const restoreHidden = document.getElementById("file_hidden_checkbox").checked;

    // Count items to restore
    let itemsToRestore = 0;
    if (restoreSubreddits) { itemsToRestore += loadedSubreddits.length }
    if (restoreSaved) { itemsToRestore += loadedSaved.length }
    if (restoreHidden) { itemsToRestore += loadedHidden.length }

    // Configure DOM progress bar
    document.getElementById("restore_progress_bar").max = itemsToRestore;
    document.getElementById("restore_progress_bar").value = 0;

    // Helper functions for later
    const updateProgressBar = function(value) {
        document.getElementById("restore_progress_bar").value += 1; 
    }

    const getFullnames = function(list) {
        let fullNames = [];

        list.forEach(function(item) {
            const fullName = item["data"]["name"];
            fullNames.push(fullName);
        })

        return fullNames
    }

    const restorePosts = async function(loadedItems, originalItems, url) {
        // Find the fullnames. Reverse the array, so the posts end up in the right order
        const loadedFullNames = getFullnames(loadedItems).reverse();
        const originalFullNames = getFullnames(originalItems);

        // Make an api request for every item
        // Avoiding .foreach because of async operations
        for (let i = 0; i < loadedFullNames.length; i++) {
            const fullName = loadedFullNames[i];
            
            // Skip over existing items
            if (originalFullNames.indexOf(fullName) == -1) {
                const formData = new FormData();
                formData.append("id", fullName);

                try {
                    await authenticatedRequest(url, options={method: "post", body: formData});
                }
                catch {}
            }

            updateProgressBar(1);
        }
    }

    // Restore subreddits
    if (restoreSubreddits) {
        // Find the fullnames
        const fullNames = getFullnames(loadedSubreddits);

        // Make a large api request with all fullnames
        const formData = new FormData();

        formData.append("action", "sub");
        formData.append("sr", fullNames.toString());

        await authenticatedRequest("https://oauth.reddit.com/api/subscribe", options={method: "post", body: formData});
        updateProgressBar(loadedSubreddits.length);
    }

    // Restore saved & hidden

    if (restoreSaved) { await restorePosts(loadedSaved, saved, "https://oauth.reddit.com/api/save"); };
    if (restoreHidden) { await restorePosts(loadedHidden, hidden, "https://oauth.reddit.com/api/hide"); };
}

function parseDataJson(string, updateDom=false) {
    let json;
    
    try {
        json = JSON.parse(string);
    }
    catch {
        alert("Not a valid JSON file. Please try again with a different file.");
        return;
    }

    try {
        loadedUser = json["user"];
        loadedTime = json["time"];
        loadedVersion = json["version"];
        loadedSubreddits = json["data"]["subreddits"];
        loadedSaved = json["data"]["saved"];
        loadedHidden = json["data"]["hidden"];
    }
    catch {
        alert("Missing fields. Please try again with a different file.");
        return;
    }

    if (updateDom) {
        document.getElementById("file_subreddit_counter").textContent = `Subreddits (${loadedSubreddits.length})`;
        document.getElementById("file_saved_counter").textContent = `Saved (${loadedSaved.length})`;
        document.getElementById("file_hidden_counter").textContent = `Hidden (${loadedHidden.length})`;

        switchStage("file_overview");
    }
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

function switchStage(newStage) {
    stage = newStage;
    setStage();
}

function handleFileSelection(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(event) { parseDataJson(event.target.result, updateDom=true); };
    reader.readAsText(file);
}

function restoreBackupButton() {
    if (confirm("PLACEHOLDER WARNING")) {
        switchStage("backup_restoring");
    }
    else {
        switchStage("overview");
    }
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

    document.getElementById("file_selection").addEventListener("change", handleFileSelection, false);
}