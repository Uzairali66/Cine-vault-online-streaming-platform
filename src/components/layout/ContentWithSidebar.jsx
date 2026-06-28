/**
 * Two-column layout: main content + sidebar (ads, affiliates).
 */
export function ContentWithSidebar({ children, sidebar, sidebarWidth = '300px' }) {
  return (
    <div className="page-with-sidebar">
      <div className="page-with-sidebar__main">{children}</div>
      {sidebar && (
        <aside
          className="page-with-sidebar__aside"
          style={{ '--sidebar-width': sidebarWidth }}
        >
          {sidebar}
        </aside>
      )}
    </div>
  );
}

export default ContentWithSidebar;
