import { ActionIcon, type ModalProps, Popover, PopoverDropdown, PopoverTarget, Text } from '@mantine/core';
import { List, Plus } from 'lucide-react';
import { AddMediaModal } from '@/components/AddMediaModal';
import { QueryKey } from '@/components/QueryProvider';
import { useAddShow } from '@/hooks/useAddMedia';
import { apiFetch } from '@/lib/api/fetch';
import { apiRoutes } from '@/lib/routes';
import type { TMDBTvShow } from '@/lib/themoviedb/tvshows';
import { BaseShowCard } from './BaseShowCard';

type Props = ModalProps;

export const AddShowModal = (props: Props) => {
  const { mutate: add, isPending: pendingAdd } = useAddShow();

  return (
    <AddMediaModal<TMDBTvShow>
      title={'Add Show'}
      {...props}
      queryKey={QueryKey.searchShows}
      queryFn={async (search) => {
        const params = new URLSearchParams({ q: search.trim() });
        const response = await apiFetch(apiRoutes.tvshowSearch(params), { method: 'get' });
        if (response.ok) return await response.json();
        throw new Error((await response.json()).message);
      }}
      builder={(show) => (
        <BaseShowCard
          key={show.id}
          h={200}
          show={{
            ...show,
            moviedb_id: show.id,
            poster_slug: show.poster,
            backdrop_slug: show.backdrop,
            metadata_refreshed_at: null,
            recommendations_refreshed_at: null,
          }}
          actions={
            <>
              <Popover width={'unset'}>
                <PopoverTarget>
                  <ActionIcon variant="white" color={'gray'} aria-label={`About ${show.name}`}>
                    <List size={'20'} />
                  </ActionIcon>
                </PopoverTarget>
                <PopoverDropdown>
                  <Text>{show.description}</Text>
                </PopoverDropdown>
              </Popover>
              <ActionIcon
                aria-label={`Add ${show.name}`}
                loading={pendingAdd}
                onClick={() => add({ moviedb_id: show.id, name: show.name })}
              >
                <Plus size={'20'} />
              </ActionIcon>
            </>
          }
        />
      )}
    />
  );
};
