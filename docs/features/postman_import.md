# Postman Import Guide

Holonet supports importing existing Postman Collections (v2.1) to help you migrate your workflows seamlessly.

## How to Import

1. Export your collection from Postman as **Collection v2.1 (recommended)**.
2. In Holonet, navigate to **Import**.
3. Upload your `.json` collection file.

## Mapping Logic

When importing, Holonet maps Postman entities to their Holonet equivalents:

| Postman Entity | Holonet Entity |
| :--- | :--- |
| **Collection** | **Workspace** |
| **Folder** | **Folder** |
| **Request** | **Request** |

*Note: All hierarchy and request details (method, URL, headers, body) are preserved.*

## Future Plans

We are actively working on expanding import capabilities. Upcoming features include:

- **Environment Variables Support:** Import Postman Environments to map variables directly into Holonet.
