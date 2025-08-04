CREATE TRIGGER enforce_node_limit_trigger
    BEFORE INSERT ON public.report_line_items
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_node_limit();