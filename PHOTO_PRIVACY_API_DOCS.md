---

## PHOTO PRIVACY MANAGEMENT

This section allows a user to control the privacy settings for their individual photos.

### 1. Get Photo Privacy Settings

-   **Endpoint**: `GET /api/v1/photos/:mediaId/privacy`
-   **Auth Required**: Yes
-   **Middleware**: `authenticate`, `validate`
-   **Description**: Retrieves the current privacy settings for a specific photo owned by the logged-in user.

**Path Params**

-   `mediaId`: `number` (Required, The ID of the photo to get settings for).

**Response**

-   **200 OK**

```json
{
    "success": true,
    "message": "Photo privacy settings retrieved successfully.",
    "data": {
        "visibility": "REGISTERED",
        "enableWatermark": true,
        "watermarkText": "My Profile",
        "watermarkPosition": "BOTTOM_RIGHT",
        "preventScreenshots": false,
        "disableRightClick": true,
        "blurForNonPremium": true,
        "blurLevel": "MEDIUM",
        "allowDownload": false,
        "allowViewRequests": true,
        "autoApprovePremium": true,
        "autoApproveVerified": false
    }
}
```

### 2. Update Photo Privacy Settings

-   **Endpoint**: `PUT /api/v1/photos/:mediaId/privacy`
-   **Auth Required**: Yes
-   **Middleware**: `authenticate`, `validate`
-   **Description**: Updates the privacy settings for a specific photo owned by the logged-in user.

**Path Params**

-   `mediaId`: `number` (Required, The ID of the photo to update).

**Request Body** (All fields are optional)

```json
{
    "visibility": "MATCHED",
    "enableWatermark": true,
    "watermarkText": "Confidential",
    "watermarkPosition": "CENTER",
    "preventScreenshots": true,
    "disableRightClick": true,
    "blurForNonPremium": true,
    "blurLevel": "HIGH",
    "allowDownload": false,
    "allowViewRequests": false,
    "autoApprovePremium": false,
    "autoApproveVerified": false
}
```

**Validation & Options**

-   `visibility`: `string` (Enum: `REGISTERED`, `MATCHED`, `HIDDEN`)
-   `enableWatermark`: `boolean`
-   `watermarkText`: `string` (Max 100 chars)
-   `watermarkPosition`: `string` (Enum: `BOTTOM_RIGHT`, `CENTER`, `TOP_LEFT`)
-   `preventScreenshots`: `boolean`
-   `disableRightClick`: `boolean`
-   `blurForNonPremium`: `boolean`
-   `blurLevel`: `string` (Enum: `LOW`, `MEDIUM`, `HIGH`)
-   `allowDownload`: `boolean`
-   `allowViewRequests`: `boolean` (Whether to allow users to request access to this photo if it's hidden from them)
-   `autoApprovePremium`: `boolean` (Automatically approve view requests from premium users)
-   `autoApproveVerified`: `boolean` (Automatically approve view requests from verified users)

**Response**

-   **200 OK**

```json
{
    "success": true,
    "message": "Photo privacy settings updated successfully.",
    "data": {
        // The updated photo privacy object
    }
}
```
