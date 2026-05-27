import { Button, Form } from "react-bootstrap";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useBackend } from "main/utils/useBackend";
import CommonsSelect from "main/components/Commons/CommonsSelect";

function InstructorReportSpecificCommonsForm({ submitAction }) {
  const testid = "InstructorReportSpecificCommonsForm";

  const { data: commons } = useBackend(
    ["/api/commons/all"],
    { url: "/api/commons/all" },
    [],
  );

  const [selectedCommons, setSelectedCommons] = useState(null);
  const [selectedCommonsName, setSelectedCommonsName] = useState(null);

  useEffect(() => {
    if (commons && commons.length > 0 && selectedCommons === null) {
      setSelectedCommons(commons[0].id);
      setSelectedCommonsName(commons[0].name);
    }
  }, [commons, selectedCommons]);

  const {
    handleSubmit,
    formState: { _errors },
  } = useForm();

  const handleCommonsSelection = (id, name) => {
    setSelectedCommons(id);
    setSelectedCommonsName(name);
  };

  const onSubmit = () => {
    const params = { selectedCommons, selectedCommonsName };
    submitAction(params);
  };

  if (!commons || commons.length === 0) {
    return <div>There are no commons on which to run this job.</div>;
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <CommonsSelect
        commons={commons}
        selectedCommons={selectedCommons}
        handleCommonsSelection={handleCommonsSelection}
        testid={testid}
      />
      <p>
        Click this button to generate an instructor report for the selected
        commons.
      </p>
      <Button
        type="submit"
        data-testid="InstructorReportSpecificCommonsForm-Submit-Button"
      >
        Generate
      </Button>
    </Form>
  );
}
export default InstructorReportSpecificCommonsForm;
