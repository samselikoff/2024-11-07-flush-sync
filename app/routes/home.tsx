import { useRef, useState } from 'react';
import {
  type LoaderFunctionArgs,
  Form,
  useNavigation,
  useSearchParams,
  useSubmit,
  useLoaderData,
} from 'react-router';
import * as ToggleGroup from '@radix-ui/react-toggle-group';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);

  return [...url.searchParams.entries()];
}

export default function Index() {
  const searchParams = useLoaderData();
  const [formRef, submitForm] = useFiltersSubmit();

  return (
    <div className="p-4">
      <h1 className="my-8">Search params</h1>
      <pre className="my-4">{JSON.stringify(searchParams, null, 2)}</pre>
      <Form
        ref={formRef}
        onChange={() => {
          console.log(
            'cannot trigger at the top level -- form is not registering a change'
          );
        }}
        className="flex flex-col gap-6"
      >
        <FilterProductStock submitForm={submitForm} />
      </Form>
    </div>
  );
}

type FilterControlsProps = {
  submitForm: ReturnType<typeof useFiltersSubmit>[1];
};

function FilterProductStock({ submitForm }: FilterControlsProps) {
  const searchParams = usePendingSearchParams();
  const available = searchParams.get('available') || undefined;

  const [value, setValue] = useState(available || undefined);

  return (
    <ToggleGroup.Root
      className="ToggleGroup"
      type="single"
      defaultValue={available}
      aria-label="Select availability"
      onValueChange={(newValue) => {
        setValue(
          newValue === 'true' || newValue === 'false' ? newValue : undefined
        );
        // If I submit here, the values of the hidden checkbox aren't in sync yet
        submitForm();
      }}
    >
      <ToggleGroup.Item value="true" asChild>
        <button className="border p-2 data-[state=on]:bg-blue-500">
          In Stock
        </button>
      </ToggleGroup.Item>
      <input
        type="checkbox"
        name="available"
        value="true"
        checked={value === 'true'}
        readOnly
        className="sr-only"
      />

      <ToggleGroup.Item value="false" asChild>
        <button className="border p-2 data-[state=on]:bg-blue-500">
          In Stock
        </button>
      </ToggleGroup.Item>
      <input
        type="checkbox"
        name="available"
        value="false"
        checked={value === 'false'}
        readOnly
        className="sr-only"
      />
    </ToggleGroup.Root>
  );
}

export function useFiltersSubmit() {
  const formRef = useRef<HTMLFormElement>(null);
  const submit = useSubmit();

  const submitForm = () => {
    const formNode = formRef.current;
    if (!formNode) {
      throw new Error('formRef must be attached to a form element');
    }

    const formData = new FormData(formNode);

    const keys = [...formData.keys()];

    for (const key of keys) {
      const value = formData.get(key);
      if (value === '') {
        formData.delete(key);
      }
    }

    submit(formData, {
      preventScrollReset: true,
      replace: true,
      method: 'get',
    });
  };

  return [formRef, submitForm] as const;
}

function usePendingSearchParams() {
  let [searchParams] = useSearchParams();

  const navigation = useNavigation();
  if (navigation.state === 'loading') {
    searchParams = new URLSearchParams(navigation.location.search);
  }

  return searchParams;
}
