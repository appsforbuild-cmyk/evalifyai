import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Users, Building2, Filter, User, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';

interface Employee {
  id: string;
  email: string;
  full_name: string;
  team: string;
  org_unit: string | null;
  created_at: string;
}

const EmployeeDirectory = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedOrgUnit, setSelectedOrgUnit] = useState<string>('all');
  const [teams, setTeams] = useState<string[]>([]);
  const [orgUnits, setOrgUnits] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm, selectedTeam, selectedOrgUnit]);

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from('employees_directory')
      .select('*')
      .order('full_name');

    if (!error && data) {
      setEmployees(data);
      
      // Extract unique teams and org units
      const uniqueTeams = [...new Set(data.map(e => e.team))].sort();
      const uniqueOrgUnits = [...new Set(data.map(e => e.org_unit).filter(Boolean))].sort() as string[];
      setTeams(uniqueTeams);
      setOrgUnits(uniqueOrgUnits);
    }
    setLoading(false);
  };

  const filterEmployees = () => {
    let filtered = [...employees];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        e => e.full_name.toLowerCase().includes(term) || 
             e.email.toLowerCase().includes(term)
      );
    }

    if (selectedTeam !== 'all') {
      filtered = filtered.filter(e => e.team === selectedTeam);
    }

    if (selectedOrgUnit !== 'all') {
      filtered = filtered.filter(e => e.org_unit === selectedOrgUnit);
    }

    setFilteredEmployees(filtered);
  };

  const getTeamColor = (team: string) => {
    const colors: Record<string, string> = {
      'Engineering': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Product': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Design': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'Marketing': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'Sales': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Finance': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'Human Resources': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'Operations': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
      'Customer Support': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
      'Data Science': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      'Legal': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      'IT Support': 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
      'Administration': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    };
    return colors[team] || 'bg-muted text-muted-foreground';
  };

  const stats = {
    total: employees.length,
    teams: teams.length,
    departments: orgUnits.length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">Employee Directory</h1>
            <p className="text-muted-foreground">Browse and search all employees in the organization</p>
          </div>
          <Button onClick={() => navigate('/team-comparison')} className="gap-2">
            <BarChart3 className="w-4 h-4" /> Team Comparison
          </Button>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Employees</CardTitle>
              <Users className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Departments</CardTitle>
              <Building2 className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.teams}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Org Units</CardTitle>
              <Filter className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.departments}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {teams.map(team => (
                    <SelectItem key={team} value={team}>{team}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedOrgUnit} onValueChange={setSelectedOrgUnit}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Org Units" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Org Units</SelectItem>
                  {orgUnits.map(unit => (
                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results count */}
        <p className="text-sm text-muted-foreground">
          Showing {filteredEmployees.length} of {employees.length} employees
        </p>

        {/* Employee Grid */}
        {loading ? (
          <div className="text-center py-12">Loading employees...</div>
        ) : filteredEmployees.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No employees found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredEmployees.map((employee) => (
              <Card 
                key={employee.id} 
                className="hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => navigate(`/employee/${employee.id}`)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                        {employee.full_name}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">{employee.email}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <Badge className={getTeamColor(employee.team)} variant="secondary">
                          {employee.team}
                        </Badge>
                        {employee.org_unit && (
                          <Badge variant="outline" className="text-xs">
                            {employee.org_unit}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EmployeeDirectory;
