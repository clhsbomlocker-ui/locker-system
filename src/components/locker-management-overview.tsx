import { useState } from "react";

function App() {
  const [lockers, setLockers] = useState([]);
  const [form, setForm] = useState({
    lockerNumber: "",
    studentName: "",
    studentID: "",
    className: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    setLockers([...lockers, form]);

    setForm({
      lockerNumber: "",
      studentName: "",
      studentID: "",
      className: "",
    });
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Locker Form</h1>

      <form onSubmit={handleSubmit}>
        <input
          name="lockerNumber"
          placeholder="Locker Number"
          value={form.lockerNumber}
          onChange={handleChange}
        /><br/>

        <input
          name="studentName"
          placeholder="Student Name"
          value={form.studentName}
          onChange={handleChange}
        /><br/>

        <input
          name="studentID"
          placeholder="Student ID"
          value={form.studentID}
          onChange={handleChange}
        /><br/>

        <input
          name="className"
          placeholder="Class"
          value={form.className}
          onChange={handleChange}
        /><br/>

        <button type="submit">Save</button>
      </form>

      <h2 style={{ marginTop: 30 }}>Locker Table</h2>
      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>Locker</th>
            <th>Student ID</th>
            <th>Name</th>
            <th>Class</th>
          </tr>
        </thead>
        <tbody>
          {lockers.map((lk, i) => (
            <tr key={i}>
              <td>{lk.lockerNumber}</td>
              <td>{lk.studentID}</td>
              <td>{lk.studentName}</td>
              <td>{lk.className}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
