const cds = require('@sap/cds');

module.exports = class EmployeeService extends cds.ApplicationService {

  async init() {
    const { Employees } = this.entities;

    this.on('generateZeugnis', async (req) => {
      const { employeeId, bulletPoints } = req.data;

      // 1. Mitarbeiterdaten aus der DB holen
      const employee = await SELECT.one.from(Employees).where({ ID: employeeId });
      if (!employee) {
        return req.error(404, `Mitarbeiter mit ID ${employeeId} nicht gefunden.`);
      }

      // 2. Zeitraum zusammenbauen
      const zeitraum = employee.endDate
        ? `${employee.startDate} bis ${employee.endDate}`
        : `seit ${employee.startDate}`;

      // 3. Prompt zusammenbauen
      const prompt = [
        'Erstelle ein professionelles Arbeitszeugnis fuer:',
        `Name: ${employee.name}`,
        `Abteilung: ${employee.department}`,
        `Position: ${employee.position}`,
        `Beschaeftigungszeitraum: ${zeitraum}`,
        `Leistungsbewertung: ${employee.performanceRating} von 5`,
        `Skills: ${employee.skills}`,
        `Teamgroesse: ${employee.teamSize} direkt gefuehrte Mitarbeiter`,
        `Besondere Leistungen: ${employee.specialAchievements || 'keine angegeben'}`,
        `Stichpunkte des Vorgesetzten: ${bulletPoints}`,
        '',
        'Das Zeugnis soll wohlwollend formuliert sein, branchenuebliche',
        'Formulierungen verwenden und circa eine DIN-A4-Seite umfassen.',
        'Verwende eine formelle Anrede und schliesse mit einem',
        'Bedauerns- und Wunsch-Absatz.'
      ].join('\n');

      // 4. GenAI Hub / AI Core aufrufen
      let generatedText;
      try {
        generatedText = await this._callGenAIHub(prompt);
      } catch (err) {
        console.error('GenAI Hub Fehler:', err.message);
        // Fallback: Statischer Demo-Text, falls GenAI Hub nicht erreichbar
        generatedText = this._getFallbackText(employee, bulletPoints, zeitraum);
      }

      // 5. Ergebnis zurueckgeben
      return {
        generatedText,
        employeeName: employee.name,
        status: 'completed',
        createdAt: new Date().toISOString()
      };
    });

    await super.init();
  }

  /**
   * Ruft den GenAI Hub (SAP AI Core Inference API) auf.
   * Verwendet die Destination AICORE_API oder Umgebungsvariablen.
   */
  async _callGenAIHub(prompt) {
    const deploymentId = process.env.AICORE_DEPLOYMENT_ID;
    const aiCoreUrl = process.env.AICORE_API_URL;

    if (!deploymentId || !aiCoreUrl) {
      console.warn('AICORE_DEPLOYMENT_ID oder AICORE_API_URL nicht gesetzt. Verwende Fallback.');
      throw new Error('AI Core nicht konfiguriert');
    }

    // Token holen (OAuth2 Client Credentials)
    const tokenUrl = process.env.AICORE_TOKEN_URL;
    const clientId = process.env.AICORE_CLIENT_ID;
    const clientSecret = process.env.AICORE_CLIENT_SECRET;

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
      })
    });
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // AI Core Inference API aufrufen
    const inferenceUrl = `${aiCoreUrl}/v2/inference/deployments/${deploymentId}/chat/completions`;
    const response = await fetch(inferenceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'AI-Resource-Group': process.env.AICORE_RESOURCE_GROUP || 'default'
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`AI Core HTTP ${response.status}: ${errBody}`);
    }

    const result = await response.json();
    return result.choices?.[0]?.message?.content || 'Kein Text generiert.';
  }

  /**
   * Fallback-Text, falls GenAI Hub nicht erreichbar ist.
   * Gibt einen statischen Demo-Text zurueck.
   */
  _getFallbackText(employee, bulletPoints, zeitraum) {
    return [
      `ARBEITSZEUGNIS (Demo-Fallback)`,
      ``,
      `${employee.name} war ${zeitraum} in unserem Unternehmen als ${employee.position}`,
      `in der Abteilung ${employee.department} taetig.`,
      ``,
      `[Dies ist ein Fallback-Text, da der GenAI Hub nicht erreichbar war.`,
      `Im Normalbetrieb wuerde hier ein KI-generiertes Zeugnis stehen,`,
      `basierend auf den Stichpunkten: ${bulletPoints}]`,
      ``,
      `Skills: ${employee.skills}`,
      `Leistungsbewertung: ${employee.performanceRating}/5`,
      `Teamgroesse: ${employee.teamSize}`,
      employee.specialAchievements ? `Besondere Leistungen: ${employee.specialAchievements}` : ''
    ].join('\n');
  }

};
