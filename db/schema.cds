namespace dsag.workshop;

entity Employees {
  key ID                  : UUID;
      name                : String(200);
      department          : String(100);
      position            : String(150);
      startDate           : Date;
      endDate             : Date;
      performanceRating   : Integer;        // 1-5 Skala
      skills              : LargeString;    // Komma-separiert
      teamSize            : Integer;
      specialAchievements : LargeString;
}
