import { useParams } from "react-router-dom";

function TeacherProfile() {
  const { slug } = useParams();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Teacher Profile: {slug}</h1>
    </div>
  );
}

export default TeacherProfile;
