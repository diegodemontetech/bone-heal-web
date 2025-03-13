
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { DepartmentSelector } from "./kanban/form/DepartmentSelector";
import { NameInput } from "./kanban/form/NameInput";
import { ColorSelector } from "./kanban/form/ColorSelector";
import { OrderInput } from "./kanban/form/OrderInput";
import { SubmitButton } from "./kanban/form/SubmitButton";
import { useStageForm } from "./kanban/form/useStageForm";
import { StageFormValues } from "@/types/crm";
import { UseFormReturn } from "react-hook-form";

interface KanbanStagesFormProps {
  onSuccess?: () => void;
}

// Definindo um tipo específico para as props de componentes que usam o form
interface FormComponentProps {
  form: UseFormReturn<StageFormValues>;
}

export function KanbanStagesForm({ onSuccess }: KanbanStagesFormProps) {
  const { form, departments, isLoading, onSubmit } = useStageForm({ 
    onSuccess: onSuccess 
  });

  return (
    <Card>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <DepartmentSelector form={form as any} departments={departments} />
            <NameInput form={form as any} />
            <ColorSelector form={form as any} />
            <OrderInput form={form as any} />
            <SubmitButton isLoading={isLoading} />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
