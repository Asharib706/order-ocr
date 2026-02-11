import streamlit as st
import pandas as pd
from db_utils import fetch_work_orders, fetch_all_work_orders, fetch_distinct_hours, get_supabase_client
from dotenv import load_dotenv

load_dotenv()

st.set_page_config(page_title="View Work Orders", layout="wide")
# Load Custom CSS
with open("style.css") as f:
    st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

st.title("📊 View Work Orders")

if not get_supabase_client():
    st.error("Supabase not configured. Please check your .env file.")
    st.stop()

# --- Filters & Controls ---
col_search, col_pages = st.columns([3, 1])

with col_search:
    search_query = st.text_input("🔍 Search (Order #, Job #, Description)", "")

with col_pages:
    page_size = st.selectbox("Rows per page", [10, 20, 50, 100], index=0)

with st.expander("Filter & Sort Options", expanded=False):
    st.caption("Apply Filters:")
    f_col1, f_col2, f_col3, f_col4 = st.columns(4)

    filters = {}

    with f_col1:
        # Hours Filter
        distinct_hours = fetch_distinct_hours()
        selected_hours = st.selectbox("Hours", ["All"] + distinct_hours)
        if selected_hours != "All":
            filters["hours"] = selected_hours

    with f_col2:
        # Signed By Both Filter
        sig_both = st.selectbox("Signed by Both?", ["All", "Yes", "No"])
        if sig_both == "Yes":
            filters["signed_by_both"] = True
        elif sig_both == "No":
            filters["signed_by_both"] = False

    with f_col3:
        # Customer Sign Filter
        cust_sign = st.selectbox("Customer Sign?", ["All", "Yes", "No"])
        if cust_sign == "Yes":
            filters["customer_sign"] = True
        elif cust_sign == "No":
            filters["customer_sign"] = False

    with f_col4:
        # WCDP Sign Filter
        wcdp_sign = st.selectbox("WCDP Sign?", ["All", "Yes", "No"])
        if wcdp_sign == "Yes":
            filters["wcdp_sign"] = True
        elif wcdp_sign == "No":
            filters["wcdp_sign"] = False

    st.divider()
    st.caption("Sort By:")
    s_col1, s_col2 = st.columns(2)
    with s_col1:
        sort_option = st.selectbox("Column", ["Created At", "Total Amount Due", "Date", "Job Number", "Hours"])
    with s_col2:
        sort_order = st.selectbox("Order", ["Descending (Z-A / Newest)", "Ascending (A-Z / Oldest)"])
    
    # Map friendly names to DB columns
    sort_map = {
        "Created At": "created_at",
        "Total Amount Due": "total_amount_due",
        "Date": "date",
        "Job Number": "job_number",
        "Hours": "hours"
    }
    db_sort_col = sort_map.get(sort_option, "created_at")
    ascending = True if "Ascending" in sort_order else False

# Initialize session state for pagination
if 'page' not in st.session_state:
    st.session_state.page = 1

# Reset page to 1 if filters/search change
current_filter_state = (search_query, selected_hours, sig_both, cust_sign, wcdp_sign, db_sort_col, ascending)

if 'last_filter_state' not in st.session_state:
    st.session_state.last_filter_state = current_filter_state

if current_filter_state != st.session_state.last_filter_state:
    st.session_state.page = 1
    st.session_state.last_filter_state = current_filter_state

# --- Fetch Data ---
with st.spinner("Fetching data..."):
    result = fetch_work_orders(
        page=st.session_state.page, 
        page_size=page_size, 
        search_query=search_query,
        filters=filters,
        sort_by=db_sort_col,
        ascending=ascending
    )

if "error" in result:
    st.error(f"Error fetching data: {result['error']}")
else:
    data = result["data"]
    total_count = result["count"]
    
    # Calculate some metrics for the current view (or fetch global if preferred, here it's filtered view)
    # Note: total_count is exact count from DB. 
    # To get nice sums we might need a separate query, but for now specific metrics on *page* or just count is safe.
    # Let's show Global Counts if no search? No, filtered metrics are better.
    
    st.divider()
    
    # Metrics Dashboard
    m1, m2, m3 = st.columns(3)
    m1.metric("Total Records", total_count)
    # Placeholder for hours sum (would need backend aggregation for pagination compatibility, omitting to avoid confusion with page-only sum)
    m2.metric("Page Records", len(data))
    
    if data:
        df = pd.DataFrame(data)
        signed_count = df['signed_by_both'].sum()
        m3.metric("Signed on Page", f"{signed_count} / {len(df)}")
        
        # Add Serial Number
        start_serial = (st.session_state.page - 1) * page_size + 1
        df.insert(0, 'serial_no', range(start_serial, start_serial + len(df)))
        
        # Reorder to put serial_no first, and exclude id/created_at from display
        # We can just hide them in column_config or drop them. 
        # User said "dont show", so let's just not show them.
        preferred_cols = ['serial_no', 'work_order_number', 'job_number', 'date', 'hours', 'total_amount_due', 'signed_by_both', 'customer_sign', 'wcdp_sign', 'description']
        # Filter existing columns
        cols_to_show = [c for c in preferred_cols if c in df.columns]
        # Add others if any (except id, created_at)
        cols_to_show += [c for c in df.columns if c not in cols_to_show and c not in ['id', 'created_at']]
        
        df_display = df[cols_to_show]

        # Display Dataframe
        st.dataframe(
            df_display, 
            use_container_width=True,
            column_config={
                "serial_no": st.column_config.NumberColumn("S.No", format="%d"),
                "signed_by_both": st.column_config.CheckboxColumn("Both Signed"),
                "customer_sign": st.column_config.CheckboxColumn("Customer"),
                "wcdp_sign": st.column_config.CheckboxColumn("WCDP"),
                "hours": st.column_config.NumberColumn("Hours", format="%.2f"),
                "total_amount_due": st.column_config.NumberColumn("Total Due", format="$%.2f"),
                "date": st.column_config.TextColumn("Date"),
                "description": st.column_config.TextColumn("Description", width="small"),
            },
            hide_index=True
        )
    else:
        st.warning("No records found.")

    # --- Pagination Controls ---
    total_pages = (total_count + page_size - 1) // page_size if total_count else 1
    
    st.divider()
    col_prev, col_info, col_next = st.columns([1, 2, 1])
    
    with col_prev:
        if st.session_state.page > 1:
            if st.button("Previous"):
                st.session_state.page -= 1
                st.rerun()
                
    with col_info:
        st.markdown(f"<div style='text-align: center; font-weight: bold; color: #555;'>Page {st.session_state.page} of {total_pages}</div>", unsafe_allow_html=True)
        
    with col_next:
        if st.session_state.page < total_pages:
            if st.button("Next"):
                st.session_state.page += 1
                st.rerun()

    # --- Download Section ---
    st.divider()
    from db_utils import fetch_all_work_orders
    import io

    if st.button("📥 Download Filtered Data as Excel"):
        with st.spinner("Preparing download..."):
            all_data = fetch_all_work_orders(
                search_query=search_query, 
                filters=filters, 
                sort_by=db_sort_col, 
                ascending=ascending
            )
            
            if all_data:
                df_all = pd.DataFrame(all_data)
                
                output = io.BytesIO()
                with pd.ExcelWriter(output, engine='openpyxl') as writer:
                    df_all.to_excel(writer, index=False, sheet_name='Work Orders')
                
                st.download_button(
                    label="Click here to Download Excel",
                    data=output.getvalue(),
                    file_name="work_orders_export.xlsx",
                    mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                )
            else:
                st.warning("No data found to download.")
