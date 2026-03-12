using dsag.workshop from '../db/schema';

service EmployeeService @(path: '/odata/v4/employees') {
  @readonly
  entity Employees as projection on workshop.Employees;

  // Zeugnis-Generierung: Holt Mitarbeiterdaten, baut Prompt zusammen, ruft GenAI Hub auf
  action generateZeugnis(employeeId : UUID, bulletPoints : String) returns {
    generatedText : LargeString;
    employeeName  : String;
    status        : String;
    createdAt     : String;
  };
}
