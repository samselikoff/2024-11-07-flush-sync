import { useRef, useState, forwardRef } from 'react';
import {
  type LoaderFunctionArgs,
  Form,
  useNavigation,
  useSearchParams,
  useSubmit,
  useLoaderData,
} from 'react-router';
import { flushSync } from 'react-dom';
import { Slot } from '@radix-ui/react-slot';
import * as RadioGroup from '@radix-ui/react-radio-group';
import * as Checkbox from '@radix-ui/react-checkbox';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  console.log();

  return [...url.searchParams.entries()];
}

export default function Index() {
  const searchParams = useLoaderData();
  const submit = useSubmit();

  return (
    <div>
      <h1>home</h1>
      <p className="my-8">
        Search params
        <pre>{JSON.stringify(searchParams, null, 2)}</pre>
      </p>
      <Form
        onChange={(e) => {
          const formNode = e.currentTarget;
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
        }}
        className="flex flex-col gap-6"
      >
        <FilterProductStock />
        <FilterPriceRange />
        <FilterProductType />
      </Form>
    </div>
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

type FilterControlsProps = {
  submitForm: ReturnType<typeof useFiltersSubmit>[1];
};

/**
 * Acts like a radio button, however if you re-select the same value it'll
 * remove it from the form data
 */
function FilterProductStock({ submitForm }: FilterControlsProps) {
  const searchParams = usePendingSearchParams();
  const available = searchParams.get(FILTER.AVAILABLE) ?? undefined;
  const [value, setValue] = useState(available);

  return (
    <RadioGroup.Root
      className="flex gap-4"
      aria-label="select availability"
      name={FILTER.AVAILABLE}
      value={value}
    >
      <RadioGroup.Item
        value="true"
        id="true"
        asChild
        checked={value === 'true'}
      >
        <Button
          className="flex justify-between text-left uppercase"
          onClick={(e) => {
            // remove the value from the form if it's already set
            // flushSync(() => {
            setValue(value === 'true' ? undefined : 'true');
            // });
            // submitForm();
          }}
        >
          In Stock
          {value === 'true' ? '✔️' : null}
        </Button>
      </RadioGroup.Item>
      <RadioGroup.Item
        value="false"
        id="false"
        asChild
        checked={value === 'false'}
      >
        <Button
          className="flex justify-between text-left uppercase"
          onClick={() => {
            // remove the value from the form if it's already set
            // flushSync(() => {
            setValue(value === 'false' ? undefined : 'false');
            // });
            // submitForm();
          }}
        >
          Out of Stock
          {value === 'false' ? '❌' : null}
        </Button>
      </RadioGroup.Item>
    </RadioGroup.Root>
  );
}

function FilterPriceRange({ submitForm }: FilterControlsProps) {
  const searchParams = usePendingSearchParams();
  const min = Number(searchParams.get(FILTER.PRICE_MIN));
  const max = Number(searchParams.get(FILTER.PRICE_MAX));
  const timeoutRef = useRef<number | null>(null);

  const debouncedSubmit = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      submitForm();
      timeoutRef.current = null;
    }, 500);
  };

  return (
    <fieldset
      className="flex items-center gap-3 font-bold"
      onChange={() => {
        // debouncedSubmit();
      }}
    >
      <label htmlFor="from">
        From <span className="sr-only">minimum price</span>
      </label>
      <PriceInput
        id="from"
        name={FILTER.PRICE_MIN}
        placeholder="0"
        defaultValue={min}
        min={0}
        max={max}
      />
      <label htmlFor="to">
        To <span className="sr-only">maximum price</span>
      </label>
      <PriceInput
        id="to"
        name={FILTER.PRICE_MAX}
        placeholder="1000"
        defaultValue={max}
        min={min}
        max={1000}
      />
    </fieldset>
  );
}

function PriceInput({
  id,
  name,
  placeholder,
  defaultValue,
  min,
  max,
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative font-normal">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 select-none">
        $
      </span>
      <input
        className="border w-20"
        type="number"
        id={id}
        name={name}
        placeholder={placeholder}
        defaultValue={defaultValue}
        min={min}
        max={max}
      />
    </div>
  );
}

function FilterProductType({ submitForm }: FilterControlsProps) {
  const searchParams = usePendingSearchParams();
  const selectedProductTypes = new Set(
    searchParams.getAll(FILTER.PRODUCT_TYPE)
  );

  return (
    <fieldset
      className="flex flex-wrap gap-3"
      onChange={() => {
        // submitForm();
      }}
    >
      {PRODUCT_TYPES.map((productType) => {
        const checked = selectedProductTypes.has(productType);
        return (
          <Checkbox.Root
            key={productType}
            className="CheckboxRoot"
            name={FILTER.PRODUCT_TYPE}
            value={productType}
            defaultChecked={checked}
            asChild
          >
            <Button className="uppercase">{productType}</Button>
          </Checkbox.Root>
        );
      })}
    </fieldset>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const Button = forwardRef(
  (
    { asChild, children, className, ...props }: ButtonProps,
    ref: React.Ref<HTMLButtonElement>
  ) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp ref={ref} {...props}>
        {children}
      </Comp>
    );
  }
);

export const FILTER = {
  AVAILABLE: 'available',
  PRICE_MIN: 'price.min',
  PRICE_MAX: 'price.max',
  PRODUCT_TYPE: 'product-type',
} as const;

export const PRODUCT_TYPES = [
  'apparel',
  'accessories',
  'stationary',
  'stickers',
  'toys',
] as const;

function usePendingSearchParams() {
  let [searchParams] = useSearchParams();

  const navigation = useNavigation();
  if (navigation.state === 'loading') {
    searchParams = new URLSearchParams(navigation.location.search);
  }

  return searchParams;
}
