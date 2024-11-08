import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { ActionFunctionArgs } from 'node_modules/react-router/dist/lib/server-runtime/routeModules';
import { useRef } from 'react';
import { Form, useSubmit } from 'react-router';

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.formData();
  console.log(Object.fromEntries(body));
}

export default function Index() {
  return (
    <div className="p-4">
      <Form className="flex flex-col gap-6">
        <FilterProductStock />
      </Form>
    </div>
  );
}

function FilterProductStock() {
  let submit = useSubmit();
  let ref = useRef<HTMLInputElement>(null);

  return (
    <ToggleGroup.Root
      type="single"
      onValueChange={(newValue) => {
        if (ref.current) {
          ref.current.value = newValue;
          submit(ref.current.closest('form'), { method: 'post' });
        }
      }}
    >
      <input ref={ref} type="hidden" name="availability" />
      <ToggleGroup.Item
        value="true"
        className="border p-2 data-[state=on]:bg-blue-500"
      >
        In Stock
      </ToggleGroup.Item>

      <ToggleGroup.Item
        value="false"
        className="border p-2 data-[state=on]:bg-blue-500"
      >
        Out of stock
      </ToggleGroup.Item>
    </ToggleGroup.Root>
  );
}
