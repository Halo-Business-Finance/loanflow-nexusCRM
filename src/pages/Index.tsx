import Layout from "@/components/Layout"
import Dashboard from "@/components/Dashboard"

const Index = () => {
  console.log('Index component rendering...');
  
  return (
    <Layout>
      <Dashboard />
    </Layout>
  );
};

export default Index;
