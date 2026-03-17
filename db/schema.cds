namespace dsag.workshop;

entity Employees {
  key ID                  : UUID;
      // Persönliche Daten
      name                : String(200);
      firstName           : String(100);
      lastName            : String(100);
      salutation          : String(20);     // Herr, Frau
      gender              : String(10);     // männlich, weiblich, divers
      dateOfBirth         : Date;
      placeOfBirth        : String(100);
      nationality         : String(100);
      // Kontaktdaten
      streetAddress       : String(200);
      postalCode          : String(10);
      city                : String(100);
      // Beschäftigungsdaten
      employeeId          : String(20);     // Personalnummer
      department          : String(100);
      position            : String(150);
      startDate           : Date;
      endDate             : Date;
      contractType        : String(50);     // unbefristet, befristet
      workingHours        : String(50);     // Vollzeit, Teilzeit (z.B. 32h/Woche)
      supervisor          : String(200);    // Name des Vorgesetzten
      // Leistungsdaten
      performanceRating   : Integer;        // 1-5 Skala
      skills              : LargeString;    // Komma-separiert
      teamSize            : Integer;
      specialAchievements : LargeString;
}
