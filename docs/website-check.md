# Website checks

The Website checks page (`/website-check`, under Compliance checks in the Data area) visits the company's public website the way a visitor's browser would and reports what DPDP expects to see there. It runs only when someone presses **Check now**. Admins and members run it; auditors read the results.

The check reads what the server sends: the home page's HTML and headers, the plain `http://` address, and the privacy notice the home page links to. A cookie banner or tracker that a script adds after the page loads is not seen.

## What is checked

Each check ends as `pass`, `warn` or `fail`. The API sends the check's id, its status and a few values (`values`); the web app words the finding from `websiteCheck.checks.<id>` in `apps/web/messages/en.json`.

| Check                  | Passes when                                                                                     | Otherwise                                                                                                                                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `reachable`            | The home page answers with a status below 400                                                   | `fail`, with the status or the reason it could not be reached                                                                                                |
| `https`                | The page was finally served over https                                                          | `fail`                                                                                                                                                       |
| `http_redirect`        | The plain `http://` address redirects to https, or its port is closed or silent                 | `fail` when it serves the site over http, `warn` when it could not be told                                                                                   |
| `certificate`          | TLS 1.2 or 1.3, and the certificate is valid for more than 14 more days                         | `warn` at 14 days or fewer, `fail` for older TLS or no https                                                                                                 |
| `hsts`                 | `Strict-Transport-Security` with a `max-age` of 180 days or more                                | `warn` for a shorter age, `fail` when missing                                                                                                                |
| `csp`                  | `Content-Security-Policy` is set (a report-only policy does not count)                          | `warn`                                                                                                                                                       |
| `content_type_options` | `X-Content-Type-Options: nosniff`                                                               | `warn`                                                                                                                                                       |
| `referrer_policy`      | `Referrer-Policy` is set                                                                        | `warn`                                                                                                                                                       |
| `frame_options`        | `X-Frame-Options`, or `frame-ancestors` in the content security policy                          | `warn`                                                                                                                                                       |
| `privacy_notice`       | A link whose words or address mention privacy or data protection is on the home page and loads  | `fail` when there is no link, or it answers 400 or above, or cannot be read                                                                                  |
| `grievance_contact`    | The grievance email in Company profile (`grievanceEmail`) is on the home page or privacy notice | `fail` when it is not; with no email in the profile, `warn` for a likely one found (`grievance`, `dpo`, `privacy`, `complaint`, `legal`) and `fail` for none |
| `cookies`              | The home page sets no cookies                                                                   | `warn`, naming up to five                                                                                                                                    |

A site that cannot be reached at all gives one result, `reachable`, failed with a reason: `dns`, `refused`, `timeout`, `certificate`, `too_many_redirects`, `not_allowed` or `other`. It is a finding, saved like any other run, not an error.

## Where it will and will not go

The address is entered with or without `https://`. Only `http` and `https` on their usual ports are visited, with no login in the address and a name that contains a dot. Anything else is refused with `URL_NOT_ALLOWED` (400).

Because the server visits an address a person typed, it connects only to addresses on the public internet. Every name is looked up first, and the check refuses it if any address it points to is private, loopback, link-local (including cloud metadata addresses), carrier-grade NAT, reserved or multicast, in IPv4 or IPv6 (`isPublicAddress`). An address typed as an IP is checked the same way, and each redirect is checked again. Such a site is saved as `reachable` failed with the reason `not_allowed`.

Limits: 5 seconds for each page, redirects included; up to 4 redirects; the first 1,000,000 bytes of a page. The privacy notice and the plain `http://` address are read side by side, so a whole check stays inside the 15-second limit of the request's database transaction.

## Results are kept

Every run is saved (`website_checks`) with its address, who ran it, when, how many checks passed, warned and failed, and the list of results. `GET /v1/website-checks` pages through them newest first (`page`, `limit`, default 10) without their results; `GET /v1/website-checks/:id` returns one with every result. Running a check is written to the activity log as `WEBSITE_CHECKED`.

The address field is filled from the `website` answer in Company profile.

## Who can do what

| Role    | See results | Run a check |
| ------- | ----------- | ----------- |
| admin   | yes         | yes         |
| member  | yes         | yes         |
| auditor | yes         | no          |
