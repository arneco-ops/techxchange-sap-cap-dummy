# Employee Data Service - CAP OData API

OData V4 Service fuer Mitarbeiterdaten und KI-gestuetzte Zeugnisgenerierung. Wird im DSAG TechXchange Workshop als Backend-Service verwendet: Liefert Mitarbeiterdaten und orchestriert die Zeugnisgenerierung (Prompt zusammenbauen + GenAI Hub aufrufen).

## Lokal starten

```bash
npm install
npx cds watch
```

Der Service laeuft unter: http://localhost:4004/odata/v4/employees

## API Endpoints

| Methode | Pfad | Beschreibung |
|---------|------|-------------|
| GET | `/odata/v4/employees/Employees` | Alle Mitarbeiter abrufen |
| GET | `/odata/v4/employees/Employees('<id>')` | Einzelnen Mitarbeiter abrufen |
| GET | `/odata/v4/employees/Employees?$filter=department eq 'IT'` | Mitarbeiter nach Abteilung filtern |
| GET | `/odata/v4/employees/Employees?$select=name,position,skills` | Bestimmte Felder auswaehlen |
| POST | `/odata/v4/employees/generateZeugnis` | Zeugnis generieren (employeeId + bulletPoints) |

## generateZeugnis Action

Die Action `generateZeugnis` orchestriert die Zeugnisgenerierung:

1. Holt Mitarbeiterdaten aus der DB anhand der `employeeId`
2. Baut den Prompt zusammen (Mitarbeiterdaten + Stichpunkte + Template)
3. Ruft den GenAI Hub (SAP AI Core Inference API) auf
4. Gibt den generierten Zeugnis-Text zurueck

**Request:**
```json
{
  "employeeId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "bulletPoints": "Teamfaehigkeit, Projektleitung, Kundenbetreuung"
}
```

**Response:**
```json
{
  "generatedText": "<generierter Zeugnis-Text>",
  "employeeName": "Sabine Mueller",
  "status": "completed",
  "createdAt": "2026-02-06T10:30:00.000Z"
}
```

## Umgebungsvariablen fuer GenAI Hub

| Variable | Beschreibung |
|----------|-------------|
| `AICORE_API_URL` | AI Core API-Endpunkt (z.B. `https://<subdomain>.ai.internalprod.eu-central-1.aws.ml.hana.ondemand.com`) |
| `AICORE_DEPLOYMENT_ID` | Deployment-ID des GenAI Hub Modells |
| `AICORE_TOKEN_URL` | OAuth2 Token-URL (z.B. `https://<subdomain>.authentication.eu10.hana.ondemand.com/oauth/token`) |
| `AICORE_CLIENT_ID` | OAuth2 Client ID aus dem AI Core Service Key |
| `AICORE_CLIENT_SECRET` | OAuth2 Client Secret aus dem AI Core Service Key |
| `AICORE_RESOURCE_GROUP` | AI Core Resource Group (Standard: `default`) |

Falls die Umgebungsvariablen nicht gesetzt sind, gibt der Service einen Fallback-Demo-Text zurueck.

## Datenmodell

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| ID | UUID | Eindeutige Mitarbeiter-ID |
| name | String(200) | Vollstaendiger Name |
| department | String(100) | Abteilung |
| position | String(150) | Aktuelle Position |
| startDate | Date | Eintrittsdatum |
| endDate | Date | Austrittsdatum (null = noch beschaeftigt) |
| performanceRating | Integer | Leistungsbewertung (1-5) |
| skills | LargeString | Komma-separierte Faehigkeiten |
| teamSize | Integer | Anzahl direkt gefuehrter Mitarbeiter |
| specialAchievements | LargeString | Besondere Erfolge und Leistungen |

## Beispieldaten

Der Service enthaelt 8 realistische Mitarbeiterdatensaetze aus verschiedenen Abteilungen (IT, Vertrieb, Personal, Finanzen, Marketing). Drei Mitarbeiter haben ein gesetztes `endDate` und eignen sich besonders fuer die Zeugnisgenerierung.

## Deployment auf BTP Cloud Foundry

### Option A: cf push (empfohlen fuer den Workshop)

```bash
npm install
cf push
```

Umgebungsvariablen fuer GenAI Hub setzen:
```bash
cf set-env employee-service AICORE_API_URL "https://..."
cf set-env employee-service AICORE_DEPLOYMENT_ID "..."
cf set-env employee-service AICORE_TOKEN_URL "https://..."
cf set-env employee-service AICORE_CLIENT_ID "..."
cf set-env employee-service AICORE_CLIENT_SECRET "..."
cf restage employee-service
```

### Option B: MTA-Deployment (produktionsnah)

```bash
npm install
npx cds build --production
cf deploy mta_archives/employee-data-service_1.0.0.mtar
```
