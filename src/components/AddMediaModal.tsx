import {
  Center,
  Loader,
  LoadingOverlay,
  Modal,
  ModalProps,
  SimpleGrid,
  Space,
  Text,
  TextInput,
} from '@mantine/core';
import { useDebouncedState } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { ReactElement } from 'react';

type Props<T> = {
  queryKey: string;
  queryFn: (search: string) => Promise<T[]>;
  builder: (elem: T) => ReactElement;
} & ModalProps;

export const AddMediaModal = <T extends object>({
  queryKey,
  queryFn,
  builder,
  ...props
}: Props<T>) => {
  const [search, setSearch] = useDebouncedState('', 500);

  const query = useQuery<T[]>({
    queryKey: [queryKey, search],
    queryFn: async () => {
      if (!search.trim()) return [];
      return await queryFn(search);
    },
    placeholderData: (prev) => prev,
    enabled: props.opened && search !== '',
  });

  return (
    <Modal {...props}>
      <TextInput
        placeholder={'Search'}
        data-autofocus
        defaultValue={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
        leftSection={<Search />}
      />
      <Space h={'md'} />
      {query.isLoading && (
        <Center>
          <Loader />
        </Center>
      )}
      {!query.isFetched && !query.isLoading && (
        <Center p={'xl'}>
          <Text size={'xl'} c={'dimmed'}>
            <Search style={{ verticalAlign: 'sub', marginRight: '4px' }} /> Search above to get
            started!
          </Text>
        </Center>
      )}
      <div style={{ position: 'relative' }}>
        <LoadingOverlay
          visible={query.isFetching}
          zIndex={1000}
          overlayProps={{ radius: 'sm', blur: 2 }}
        />
        <SimpleGrid cols={{ xs: 1, sm: 2 }}>{query.data?.map(builder)}</SimpleGrid>
      </div>
    </Modal>
  );
};
