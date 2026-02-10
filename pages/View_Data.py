import streamlit as st
import pandas as pd
from db_utils import fetch_work_orders, fetch_all_work_orders, fetch_distinct_hours, get_supabase_client
from dotenv import load_dotenv

load_dotenv()

st.set_page_config(page_title="View Work Orders", layout="wide")
st.title("View Work Orders")

if not get_supabase_client():
    st.error("Supabase not configured. Please check your .env file.")
    st.stop()

# --- Filters & Controls ---
col_search, col_pages = st.columns([3, 1])

with col_search:
    search_query = st.text_input("Search (Order #, Job #, Description)", "")

with col_pages:
    page_size = st.selectbox("Rows per page", [10, 20, 50, 100], index=0)

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

# Initialize session state for pagination
if 'page' not in st.session_state:
    st.session_state.page = 1

# Reset page to 1 if filters/search change
# Using simple hashable representation to check for changes
current_filter_state = (search_query, selected_hours, sig_both, cust_sign, wcdp_sign)

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
        filters=filters
    )

if "error" in result:
    st.error(f"Error fetching data: {result['error']}")
else:
    data = result["data"]
    total_count = result["count"]
    
    # --- Display Data ---
    st.info(f"Total Records Found: {total_count}")
    
    if data:
        df = pd.DataFrame(data)
        
        # Display Dataframe
        st.dataframe(
            df, 
            use_container_width=True,
            column_config={
                "created_at": st.column_config.DatetimeColumn("Created At", format="D MMM YYYY, h:mm a"),
                "signed_by_both": st.column_config.CheckboxColumn("Signed (Both)"),
                "customer_sign": st.column_config.CheckboxColumn("Customer Sign"),
                "wcdp_sign": st.column_config.CheckboxColumn("WCDP Sign"),
            },
            hide_index=True
        )
    else:
        st.warning("No records found.")

    # --- Pagination Controls ---
    total_pages = (total_count + page_size - 1) // page_size if total_count else 1
    
    col_prev, col_info, col_next = st.columns([1, 2, 1])
    
    with col_prev:
        if st.session_state.page > 1:
            if st.button("Previous"):
                st.session_state.page -= 1
                st.rerun()
                
    with col_info:
        st.markdown(f"<div style='text-align: center'>Page {st.session_state.page} of {total_pages}</div>", unsafe_allow_html=True)
        
    with col_next:
        if st.session_state.page < total_pages:
            if st.button("Next"):
                st.session_state.page += 1
                st.rerun()

    # --- Download Section ---
    st.divider()
    from db_utils import fetch_all_work_orders
    import io

    if st.button("Download Filtered Data as Excel"):
        with st.spinner("Preparing download..."):
            all_data = fetch_all_work_orders(search_query=search_query, filters=filters)
            
            if all_data:
                df_all = pd.DataFrame(all_data)
                
                # Format specific columns if needed or just dump
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
