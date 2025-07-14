import { useAlert } from '@/hooks/useAlert';
import { useRefreshShow } from '@/hooks/useRefresh';
import { TMDBTvShow } from '@/lib/themoviedb/tvshows';
import {
  ActionIcon,
  Center,
  Loader,
  LoadingOverlay,
  Modal,
  ModalProps,
  Popover,
  PopoverDropdown,
  PopoverTarget,
  SimpleGrid,
  Space,
  Text,
  TextInput,
} from '@mantine/core';
import { useDebouncedState } from '@mantine/hooks';
import { useMutation, useQuery } from '@tanstack/react-query';
import { List, Plus, Search } from 'lucide-react';
import { BaseShowCard } from './BaseShowCard';

type Props = { onAdd: () => void } & ModalProps;

export const AddShowModal = ({ onAdd, ...props }: Props) => {
  const [search, setSearch] = useDebouncedState('', 500);
  const { showSuccess, showError } = useAlert();

  const {
    isLoading: isFirstLoading,
    isFetching,
    data,
  } = useQuery<TMDBTvShow[]>({
    queryKey: ['searchShows', search],
    queryFn: async () => {
      if (!search.trim()) return [];
      const params = new URLSearchParams({ q: search.trim() });
      const response = await fetch(`/api/tvshow/search?${params.toString()}`, { method: 'get' });
      if (response.ok) return await response.json();
      throw new Error((await response.json()).message);
    },
    placeholderData: (prev) => prev,
    enabled: props.opened && search !== '',
  });

  const { refresh } = useRefreshShow();

  const { mutate: add, isPending: pendingAdd } = useMutation<
    { tvshowId: number },
    Error,
    { moviedb_id: number; name: string }
  >({
    mutationFn: async (tvshow) => {
      const response = await fetch('/api/tvshow', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ moviedb_id: tvshow.moviedb_id }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message);
      return { tvshowId: json.tvshow_id };
    },
    onSuccess: (data, tvshow) => {
      onAdd();
      refresh({ tvshowId: data.tvshowId, name: tvshow.name });
      showSuccess('Nice!', `You're now following ${tvshow.name}`);
    },
    onError(error) {
      showError('An error occurred', error.message);
    },
  });

  console.log(isFirstLoading);

  return (
    <Modal title={'Add Show'} {...props}>
      <TextInput
        label="Search"
        placeholder="Search"
        defaultValue={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
        leftSection={<Search />}
      />
      <Space h={'md'} />
      {isFirstLoading && (
        <Center>
          <Loader type={'dots'} />
        </Center>
      )}
      <div style={{ position: 'relative' }}>
        <LoadingOverlay
          loaderProps={{ type: 'dots' }}
          visible={isFetching}
          zIndex={1000}
          overlayProps={{ radius: 'sm', blur: 2 }}
        />
        <SimpleGrid cols={{ xs: 1, sm: 2 }}>
          {data?.map((show) => (
            <BaseShowCard
              key={show.id}
              h={200}
              show={{
                ...show,
                moviedb_id: show.id,
                poster_slug: show.poster,
                backdrop_slug: show.backdrop,
              }}
              actions={
                <>
                  <Popover width={'unset'}>
                    <PopoverTarget>
                      <ActionIcon color={'blue'}>
                        <List />
                      </ActionIcon>
                    </PopoverTarget>
                    <PopoverDropdown>
                      <Text>{show.description}</Text>
                    </PopoverDropdown>
                  </Popover>
                  <ActionIcon
                    loaderProps={{ type: 'dots' }}
                    loading={pendingAdd}
                    onClick={() => add({ moviedb_id: show.id, name: show.name })}
                  >
                    <Plus />
                  </ActionIcon>
                </>
              }
            />
          ))}
        </SimpleGrid>
      </div>
    </Modal>
  );
};
