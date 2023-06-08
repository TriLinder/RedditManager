<h1 align="center">REDDIT API CHANGES</h1>

Due to the [API changes made by Reddit](https://www.reddit.com/r/apolloapp/comments/13ws4w3/had_a_call_with_reddit_to_discuss_pricing_bad/), and their ridiculous prices, it's no longer feasible for this project to exist. Nor do I want to support their platform any longer.

If, by any chance, you still want to use this application, you'll need to provide your own API client ID in the `config.json` file. But I can't provide any assurance, that this app will work into the future. I highly recommend considering switching to an alternative platform, like [Lemmy](https://join-lemmy.org/).

---

<p align="center"><img title="RedditManager icon" src="README_ASSETS/icon.png" alt="RedditManager icon" width="84"></p>

<h1 align="center">RedditManager</h1>
<p align="center">Backup and restore your Reddit account.</p>

## How to run

RedditManager is a JavaScript web-app.

Everything is processed client-side, so there is no need for a special web server and no data ever leaves your computer.

All you need is your own web server running on port `8080`.

Then simply connect to the website from your browser of choice.

## Troubleshooting

Make sure any ad-blocking or anti-tracking extensions are disabled, as they tend to block suspicious requests to 3rd parties (like Reddit). Privacy-friendly browsers like Firefox or Brave might also cause issues with anti-tracking features.

Don't worry, this application won't steal your data. In fact, *almost* all of your data is lost the second you close the tab.

## Screenshots

<img title="A screenshot showing the application after loading user data" src="README_ASSETS/screenshots/1.png" alt="A screenshot showing the application after loading user data" width="580">

<img title="A screenshot showing the application about to restore from a backup" src="README_ASSETS/screenshots/2.png" alt="A screenshot showing the application about to restore from a backup" width="580">

## Credits

- `bootstrap.min.css` from https://github.com/twbs/bootstrap

- https://tabler-icons.io/i/tool was used for the icon.
