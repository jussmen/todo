import { supabaseClient } from '../lib/supabaseClient';
import { Todo } from '../types/Todo';

const supabase = supabaseClient;

export class TodoApi {
  async readItems(): Promise<Todo[]> {
    const { data, error } = await supabase
      .from('todos')
      .select('id, text, done')
      .order('id', { ascending: false });

    if (error) throw error;
    return data as Todo[];
  }

  async createItem(item: Omit<Todo, 'id'>) {
    const { error } = await supabase.from('todos').insert(item);
    if (error) throw error;
  }

  async updateItem(item: Todo) {
    const { error } = await supabase
      .from('todos')
      .update(item)
      .eq('id', item.id);
    if (error) throw error;
  }

  async deleteItem(id: number) {
    const { error } = await supabase.from('todos').delete().eq('id', id);
    if (error) throw error;
  }
}

