---

## GENERAL PRIVACY SETTINGS

This section covers endpoints for managing a user's overall profile privacy, communication preferences, search visibility, and account security. All endpoints require authentication.

---

### 1. Profile Privacy

Controls the visibility of individual fields on a user's profile.

#### Get Profile Privacy Settings

-   **Endpoint**: `GET /api/v1/privacy/profile`
-   **Description**: Retrieves the current visibility settings for the logged-in user's profile fields.

**Response (200 OK)**

```json
{
    "success": true,
    "message": "Profile privacy settings retrieved.",
    "data": {
        "profileVisibility": "REGISTERED",
        "showLastName": true,
        "showEmail": "MATCHED",
        // ... other settings
    }
}
```

#### Update Profile Privacy Settings

-   **Endpoint**: `PUT /api/v1/privacy/profile`
-   **Description**: Updates the visibility settings for the logged-in user's profile.

**Request Body** (All fields are optional)

-   `profileVisibility`: `string` (Enum: `PUBLIC`, `REGISTERED`, `MATCHED`, `HIDDEN`)
-   `showLastName`: `boolean`
-   `showExactAge`: `boolean`
-   `showDateOfBirth`: `boolean`
-   `showPhoneNumber`: `string` (Enum: `PUBLIC`, `REGISTERED`, `MATCHED`, `HIDDEN`)
-   `showEmail`: `string` (Enum: `PUBLIC`, `REGISTERED`, `MATCHED`, `HIDDEN`)
-   `showSocialMedia`: `string` (Enum: `PUBLIC`, `REGISTERED`, `MATCHED`, `HIDDEN`)
-   `showExactLocation`: `boolean`
-   `showCity`: `boolean`
-   `showState`: `boolean`
-   `showCompanyName`: `boolean`
-   `showAnnualIncome`: `string` (Enum: `PUBLIC`, `REGISTERED`, `MATCHED`, `HIDDEN`)
-   `showWorkLocation`: `boolean`
-   `showFamilyDetails`: `string` (Enum: `PUBLIC`, `REGISTERED`, `MATCHED`, `HIDDEN`)
-   `showParentOccupation`: `boolean`
-   `showSiblingDetails`: `boolean`
-   `showHoroscope`: `boolean`
-   `showHoroscopeTo`: `string` (Enum: `PUBLIC`, `REGISTERED`, `MATCHED`, `HIDDEN`)
-   `showBirthTime`: `boolean`
-   `showBirthPlace`: `boolean`
-   `showDiet`: `boolean`
-   `showSmokingDrinking`: `string` (Enum: `PUBLIC`, `REGISTERED`, `MATCHED`, `HIDDEN`)
-   `showLastActive`: `boolean`
-   `showOnlineStatus`: `boolean`
-   `showProfileViews`: `boolean`
-   `showWhoViewedProfile`: `boolean`
-   `showShortlistedBy`: `boolean`
-   `showNativeDistrict`: `boolean`
-   `showNativeVillage`: `boolean`

**Response (200 OK)**: Returns the updated profile privacy object.

---

### 2. Communication Settings

Manages who can contact the user and how.

#### Get Communication Settings

-   **Endpoint**: `GET /api/v1/privacy/communication`
-   **Description**: Retrieves the user's current communication preferences.

**Response (200 OK)**: Returns the communication settings object.

#### Update Communication Settings

-   **Endpoint**: `PUT /api/v1/privacy/communication`
-   **Description**: Updates the user's communication preferences.

**Request Body** (All fields are optional)

-   `allowMatchRequestsFrom`: `string` (Enum: `EVERYONE`, `MATCHED_ONLY`, `HIDDEN`)
-   `minAgeForRequests`: `number` (Integer, min 18)
-   `maxAgeForRequests`: `number` (Integer, max 100)
-   `allowedReligions`: `array` of `string`
-   `allowedLocations`: `array` of `string`
-   `minEducationLevel`: `string` (Enum from `EDUCATION_LEVEL`)
-   `allowMessagesFrom`: `string` (Enum: `EVERYONE`, `MATCHED_ONLY`)
-   `blockUnverifiedProfiles`: `boolean`
-   `requireMinProfileCompleteness`: `number` (Integer, 0-100)
-   `allowAnonymousViews`: `boolean`
-   `notifyOnView`: `boolean`
-   `blockRepeatedViews`: `boolean`
-   `autoResponseEnabled`: `boolean`
-   `autoResponseMessage`: `string` (Max 1000 chars)
-   `sendAutoResponseToNewMatches`: `boolean`
-   `maxMatchRequestsPerDay`: `number` (Positive integer)
-   `maxMessagesPerDay`: `number` (Positive integer)
-   `preferChhattisgarhi`: `boolean`

**Response (200 OK)**: Returns the updated communication settings object.

---

### 3. Search Visibility Settings

Controls how the user's profile appears in search results and suggestions.

#### Get Search Visibility Settings

-   **Endpoint**: `GET /api/v1/privacy/search`
-   **Description**: Retrieves the user's current search visibility settings.

**Response (200 OK)**: Returns the search visibility object.

#### Update Search Visibility Settings

-   **Endpoint**: `PUT /api/v1/privacy/search`
-   **Description**: Updates the user's search visibility settings.

**Request Body** (All fields are optional)

-   `showInSearch`: `boolean`
-   `showInSuggestions`: `boolean`
-   `visibleToFreeUsers`: `boolean`
-   `visibleToPremiumUsers`: `boolean`
-   `visibleToVerifiedUsers`: `boolean`
-   `showOnlyInCountry`: `boolean`
-   `showOnlyInState`: `boolean`
-   `showOnlyInCity`: `boolean`
-   `excludedCountries`: `array` of `string`
-   `showOnlyToAgeRange`: `boolean`
-   `visibleMinAge`: `number` (Integer, min 18)
-   `visibleMaxAge`: `number` (Integer, max 100)
-   `incognitoEnabled`: `boolean`
-   `hideFromSearch`: `boolean`
-   `hideLastActive`: `boolean`
-   `browseAnonymously`: `boolean`
-   `profilePaused`: `boolean`
-   `pauseReason`: `string` (Max 100 chars)
-   `pausedUntil`: `string` (ISO 8601 datetime)
-   `showOnlyInChhattisgarh`: `boolean`
-   `prioritizeChhattisgarhi`: `boolean`

**Response (200 OK)**: Returns the updated search visibility object.

---

### 4. Account Security Settings

Manages security-related features for the user's account.

#### Get Account Security Settings

-   **Endpoint**: `GET /api/v1/privacy/security`
-   **Description**: Retrieves the user's current account security settings.

**Response (200 OK)**: Returns the account security settings object.

#### Update Account Security Settings

-   **Endpoint**: `PUT /api/v1/privacy/security`
-   **Description**: Updates the user's account security settings.

**Request Body** (All fields are optional)

-   `twoFactorEnabled`: `boolean`
-   `twoFactorMethod`: `string` (Enum: `SMS`, `EMAIL`, `BOTH`)
-   `requireOtpNewDevice`: `boolean`
-   `requireOtpNewLocation`: `boolean`
-   `sessionTimeout`: `number` (Positive integer, in minutes)
-   `maxActiveSessions`: `number` (Positive integer)
-   `recoveryEmail`: `string` (Valid email format)
-   `recoveryPhone`: `string` (Valid Indian phone number format)

**Response (200 OK)**: Returns the updated account security object.
