## Install DPDP Kit for Claude

This lets Claude Desktop set up your DPDP compliance work in DPDP Kit: policies, controls, proof and the people they are given to. Claude drafts, and you read and approve everything in the app.

### Before you start

- **Claude Desktop**, signed in. Get it from claude.ai/download. The website and the phone app cannot use it.
- **An API key** from DPDP Kit. Ask the person who runs your DPDP Kit to make one under Settings, API keys, with the role you need.

### Install

**1. Download the file.** Scroll to **Assets** at the bottom of this page and download **dpdp-kit.mcpb**.

![The Assets list on this page, with dpdp-kit.mcpb to download](https://raw.githubusercontent.com/techdome-io/DPDP-Kit/main/docs/images/mcp/0-download.png)

**2. Open the extensions page.** In Claude Desktop, open **Settings**, choose **Desktop app**, then click **Manage** next to **Extensions**.

![Settings, Desktop app, with the Extensions row and its Manage button](https://raw.githubusercontent.com/techdome-io/DPDP-Kit/main/docs/images/mcp/1-settings-extensions.png)

**3. Drag the file in.** Drag the downloaded **dpdp-kit.mcpb** onto that page, then click **Install**.

![The Extensions page, which says to drag .MCPB files here to install](https://raw.githubusercontent.com/techdome-io/DPDP-Kit/main/docs/images/mcp/2-drag-file.png)

Claude Desktop warns that the extension is not verified by Anthropic. That is expected for an extension that is not in Anthropic's own directory. Only install a file you got from your own team.

**4. Enter the address and your key.** A box opens with two fields:

- **DPDP Kit address**: the web address of your DPDP Kit API, starting with `https://`. Use the one you were given.
- **API key**: paste your key. It stays on your computer and is sent only to that address.

Click **Save**.

![The Configure box, with the DPDP Kit address and API key fields](https://raw.githubusercontent.com/techdome-io/DPDP-Kit/main/docs/images/mcp/3-address-and-key.png)

**5. Switch it on.** After saving, turn on the **Enabled** switch. It should show as enabled with "All requirements met".

![The DPDP Kit extension with the Enabled switch on](https://raw.githubusercontent.com/techdome-io/DPDP-Kit/main/docs/images/mcp/4-enabled.png)

**6. Start a new conversation.** Open a **new, normal conversation**, not a Code session. Ask: _"Do you have access to DPDP Kit?"_ Claude should answer from your own DPDP Kit.

![Claude confirming it is connected to DPDP Kit](https://raw.githubusercontent.com/techdome-io/DPDP-Kit/main/docs/images/mcp/5-working.png)

Then try the real work, for example: _"Add a vendor data sharing policy under DPDP and draft its text."_

### What to expect

- Claude asks you before it adds or changes anything, and it speaks in plain words.
- It saves policies as **drafts**. It cannot approve, send back or reopen a policy. Open **Policies** in DPDP Kit to read a draft and send it for approval.
- Claude asks before it archives or removes anything.

### Updating

Download the newest **dpdp-kit.mcpb** from the latest release and drag it into the Extensions page again. It replaces the old one.

### If something is wrong

- **Claude does not seem to know DPDP Kit.** Start a new conversation. A conversation that was already open before you switched the extension on will not see it. If it still does not appear, quit Claude Desktop completely and open it again.
- **It says the key is missing or not accepted.** Open the extension, click **Configure**, and enter the key again. If the key was revoked, ask for a new one.
- **It says it is not allowed.** Your key's role does not cover that. Ask for a key with the role you need.
