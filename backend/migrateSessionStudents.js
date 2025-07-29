import mysql2 from "mysql2/promise";

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "Raintail0!",
  database: "main_db",
};

async function migrate() {
  const db = await mysql2.createConnection(dbConfig);

  try {
    console.log("🚀 Starting migration from scheduled_sessions → session_students...");

    const [sessions] = await db.query(
      "SELECT id, students FROM scheduled_sessions"
    );

    let insertedCount = 0;
    let missingNames = [];

    for (const session of sessions) {
      if (!session.students) continue;

      const names = session.students
        .split(",")
        .map((n) =>
          n
            .replace(/\(.*?\)/g, "")  // remove (NUS), (Duke) etc
            .replace(/^NUS\s*/i, "")  // remove "NUS " prefix
            .trim()
        )
        .filter((n) => n.length > 0);

      for (const name of names) {
        const [student] = await db.query(
          "SELECT user_id FROM student_database WHERE name = ?",
          [name]
        );

        if (student.length > 0) {
          const userId = student[0].user_id;

          try {
            const [insertResult] = await db.query(
              "INSERT INTO session_students (scheduled_session_id, user_id) VALUES (?, ?)",
              [session.id, userId]
            );

            if (insertResult.affectedRows > 0) {
              console.log(`✅ Linked ${name} → Session ID ${session.id}`);
              insertedCount++;
            } else {
              console.warn(`⚠ Failed to insert ${name} (Session ID ${session.id})`);
            }
          } catch (insertError) {
            console.error(
              `❌ Insert failed for ${name} (Session ID ${session.id}):`,
              insertError.sqlMessage
            );
          }
        } else {
          missingNames.push(name);
          console.warn(`⚠ No match found for: "${name}"`);
        }
      }
    }

    console.log(`\n✅ Migration completed! Inserted ${insertedCount} records.`);
    if (missingNames.length > 0) {
      console.log("⚠ Unmatched names:", [...new Set(missingNames)]);
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await db.end();
  }
}

migrate();
