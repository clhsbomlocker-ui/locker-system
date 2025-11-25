import { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

export default function LockerTable() {
  const [lockers, setLockers] = useState([]);
  
  useEffect(() => {
    const loadLockers = async () => {
      const lockerSnapshot = await getDocs(collection(db, "lockers"));
      const lockerData = [];

      for (let lockerDoc of lockerSnapshot.docs) {
        let data = lockerDoc.data();

        // If occupied → fetch student record
        if (data.studentUID) {
          const studentRef = doc(db, "students", data.studentUID);
          const studentSnapshot = await getDoc(studentRef);

          if (studentSnapshot.exists()) {
            const stu = studentSnapshot.data();
            data.studentID = stu.studentID || "-";
            data.studentName = stu.name || "-";
          }
        }

        lockerData.push({
          id: lockerDoc.id,
          ...data,
        });
      }

      setLockers(lockerData);
    };

    loadLockers();
  }, []);

  return (
    <table>
      <thead>
        <tr>
          <th>Locker</th>
          <th>Occupied</th>
          <th>Student ID</th>
          <th>Student Name</th>
        </tr>
      </thead>
      <tbody>
        {lockers.map((lk) => (
          <tr key={lk.id}>
            <td>{lk.lockerNumber}</td>
            <td>{lk.occupied ? "Yes" : "No"}</td>
            <td>{lk.studentID || "-"}</td>
            <td>{lk.studentName || "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
